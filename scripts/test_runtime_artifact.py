import copy
import importlib.util
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("artifact", Path(__file__).with_name("runtime-artifact.py"))
artifact = importlib.util.module_from_spec(spec)
spec.loader.exec_module(artifact)


class RuntimeArtifactTests(unittest.TestCase):
    def setUp(self):
        base = Path(__file__).resolve().parent.parent / ".ai-work/runs"
        base.mkdir(parents=True, exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(dir=base)
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.contract = json.loads(artifact.CONTRACT.read_text())
        for name in self.contract["required"]:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("synthetic runtime module\n")
        package = {"version": "1.0.1"}
        (self.root / "package.json").write_text(json.dumps(package))
        (self.root / "back-end/package.json").write_text(json.dumps({**package, "dependencies": {}}))
        (self.root / "front-end/package.json").write_text(json.dumps(package))
        lock = json.dumps({"version": "1.0.1", "packages": {"": {"version": "1.0.1"}}})
        (self.root / "package-lock.json").write_text(lock)
        (self.root / "back-end/package-lock.json").write_text(lock)
        marker = json.dumps({
            "release": "v1.0.1",
            "commitSha": "a" * 40,
            "deployedAt": "2026-09-20T00:00:00Z",
        })
        (self.root / "front-end/.output/public/release.json").write_text(marker)
        (self.root / artifact.RELEASE_MARKER).write_text(marker)

    def manifest(self):
        return {
            "format": 1,
            "commit": "a" * 40,
            "contract": self.contract,
            "files": artifact.inventory(self.root),
        }

    def test_valid_tree(self):
        artifact.validate(self.root, self.manifest())

    def test_deployment_requirements_are_bound_and_validated(self):
        deployment = self.manifest()["contract"]["deployment"]
        self.assertEqual(deployment["applicationId"], "thetutorlyfe.com")
        self.assertEqual(deployment["schemaVersion"], 1)
        for field, value in [
            ("applicationId", "vitesse-nuxt-template"),
            ("requiredHostCapabilities", []),
            ("probes", {}),
            ("rollback", "unverified"),
        ]:
            with self.subTest(field=field):
                changed = copy.deepcopy(self.contract)
                changed["deployment"][field] = value
                path = self.root.parent / "altered-contract.json"
                path.write_text(json.dumps(changed))
                with patch.object(artifact, "CONTRACT", path):
                    with self.assertRaisesRegex(ValueError, "deployment compatibility contract"):
                        artifact.validate(self.root, self.manifest())

    def test_hash_tampering(self):
        manifest = self.manifest()
        (self.root / "back-end/dist/app.js").write_text("changed")
        with self.assertRaisesRegex(ValueError, "hashes"):
            artifact.validate(self.root, manifest)

    def test_missing_module_even_if_inventory_omits_it(self):
        (self.root / "back-end/dist/boundedRateStore.js").unlink()
        with self.assertRaisesRegex(ValueError, "required runtime path missing"):
            artifact.validate(self.root, self.manifest())

    def test_symlinks_and_private_state(self):
        for name in [".env", "credentials.json", "back-end/dist/key.pem", "back-end/dist/enrollment.sqlite3"]:
            with self.subTest(name=name):
                path = self.root / name
                path.write_text("synthetic forbidden content")
                with self.assertRaisesRegex(ValueError, "forbidden"):
                    self.manifest()
                path.unlink()
        (self.root / "back-end/dist/escape").symlink_to("/tmp")
        with self.assertRaisesRegex(ValueError, "forbidden"):
            self.manifest()

    def test_missing_production_dependency(self):
        package = {"version": "1.0.1", "dependencies": {"fixture": "1.0.0"}}
        (self.root / "back-end/package.json").write_text(json.dumps(package))
        (self.root / "back-end/package-lock.json").write_text(json.dumps({
            "version": "1.0.1",
            "packages": {"": package, "node_modules/fixture": {"version": "1.0.0"}},
        }))
        with self.assertRaisesRegex(ValueError, "production dependency missing"):
            artifact.validate(self.root, self.manifest())

    def test_identity_cannot_be_rehashed_to_another_commit(self):
        path = self.root / "front-end/.output/public/release.json"
        value = json.loads(path.read_text())
        value["commitSha"] = "b" * 40
        path.write_text(json.dumps(value))
        with self.assertRaisesRegex(ValueError, "static deployment identity"):
            artifact.validate(self.root, self.manifest())

    def test_malformed_identity_cannot_be_rehashed(self):
        markers = [
            {},
            {"release": "v1.0.1", "commitSha": "a" * 40},
            {"release": "v1.0.1", "commitSha": "a" * 40, "deployedAt": "2026-02-30T00:00:00Z"},
        ]
        for marker in markers:
            with self.subTest(marker=marker):
                for name in ["front-end/.output/public/release.json", artifact.RELEASE_MARKER]:
                    (self.root / name).write_text(json.dumps(marker))
                with self.assertRaisesRegex(ValueError, "invalid deployment identity"):
                    artifact.validate(self.root, self.manifest())

    def test_unlisted_native_and_development_packages_are_rejected(self):
        native = self.root / "back-end/dist/unreviewed.node"
        native.write_text("synthetic native fixture")
        with self.assertRaisesRegex(ValueError, "undeclared native binding"):
            artifact.validate(self.root, self.manifest())
        native.unlink()
        package = self.root / "back-end/node_modules/fixture/package.json"
        package.parent.mkdir(parents=True)
        package.write_text(json.dumps({"version": "1.0.0"}))
        lock = self.root / "back-end/package-lock.json"
        value = json.loads(lock.read_text())
        value["packages"]["node_modules/fixture"] = {"version": "1.0.0", "dev": True}
        lock.write_text(json.dumps(value))
        with self.assertRaisesRegex(ValueError, "development dependency in runtime"):
            artifact.validate(self.root, self.manifest())

    def test_native_compiler_cannot_be_promoted_as_a_runtime_dependency(self):
        backend_path = self.root / "back-end/package.json"
        backend = json.loads(backend_path.read_text())
        backend["dependencies"]["typescript-native"] = "npm:typescript@7.0.2"
        backend_path.write_text(json.dumps(backend))
        compiler = self.root / "back-end/node_modules/typescript-native/package.json"
        compiler.parent.mkdir(parents=True)
        compiler.write_text(json.dumps({"version": "7.0.2"}))
        lock_path = self.root / "back-end/package-lock.json"
        lock = json.loads(lock_path.read_text())
        lock["packages"][""] = backend
        lock["packages"]["node_modules/typescript-native"] = {"version": "7.0.2"}
        lock_path.write_text(json.dumps(lock))
        with self.assertRaisesRegex(ValueError, "development tool in runtime"):
            artifact.validate(self.root, self.manifest())

    def test_exact_archive_roundtrip_and_post_copier_verification(self):
        with tempfile.TemporaryDirectory(dir=self.root.parent) as temporary:
            output = Path(temporary)
            archive = output / "runtime.tar.gz"
            unpacked = output / "unpacked"
            unpacked.mkdir(mode=0o700)
            command = [sys.executable, "-B", str(Path(artifact.__file__))]
            (self.root / "back-end/dist/server.js").chmod(0o751)
            (self.root / "package-lock.json").chmod(0o600)
            (self.root / artifact.MANIFEST).write_text(json.dumps(self.manifest()))
            with tarfile.open(archive, "w:gz") as target:
                for path in self.root.rglob("*"):
                    if path.is_file():
                        target.add(path, arcname=path.relative_to(self.root).as_posix())
            sha = artifact.digest(archive)
            arguments = ["--archive", str(archive), "--sha256", sha, "--commit", "a" * 40]
            subprocess.run([*command, "unpack", str(unpacked), *arguments], check=True, capture_output=True, umask=0o077)
            for directory in [unpacked, *(path for path in unpacked.rglob("*") if path.is_dir())]:
                self.assertEqual(stat.S_IMODE(directory.stat().st_mode), 0o755)
                self.assertEqual(directory.stat().st_uid, os.geteuid())
            with tarfile.open(archive, "r:gz") as source:
                for member in source.getmembers():
                    target = unpacked / member.name
                    self.assertEqual(stat.S_IMODE(target.stat().st_mode), member.mode & 0o755)
                    self.assertEqual(target.stat().st_uid, os.geteuid())
            subprocess.run([*command, "verify", str(unpacked), *arguments], check=True, capture_output=True)
            (unpacked / "back-end/dist/boundedRateStore.js").unlink()
            manifest = json.loads((unpacked / artifact.MANIFEST).read_text())
            manifest["files"].pop("back-end/dist/boundedRateStore.js")
            (unpacked / artifact.MANIFEST).write_text(json.dumps(manifest))
            result = subprocess.run([*command, "verify", str(unpacked), *arguments], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("differs from trusted archive", result.stderr)

    def test_protected_manifest_checksum_cannot_be_reissued_from_the_tree(self):
        command = [sys.executable, "-B", str(Path(artifact.__file__))]
        manifest_path = self.root / artifact.MANIFEST
        historical = self.manifest()
        historical["contract"] = {**historical["contract"], "version": 0}
        manifest_path.write_text(json.dumps(historical))
        manifest_sha = artifact.digest(manifest_path)
        arguments = ["--manifest-sha256", manifest_sha, "--commit", "a" * 40]

        current_contract = subprocess.run(
            [*command, "verify", str(self.root), "--commit", "a" * 40], capture_output=True, text=True,
        )
        self.assertNotEqual(current_contract.returncode, 0)
        self.assertIn("independently trusted runtime contract", current_contract.stderr)
        subprocess.run([*command, "verify", str(self.root), *arguments], check=True, capture_output=True)

        manifest_path.write_text(manifest_path.read_text() + "\n")
        result = subprocess.run(
            [*command, "verify", str(self.root), *arguments], capture_output=True, text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("trusted manifest checksum mismatch", result.stderr)


if __name__ == "__main__":
    unittest.main()
