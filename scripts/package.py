"""Create an upload-ready static ZIP and a source ZIP without credentials."""
import argparse
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(args.output / 'paper-recipe-web.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted((root / 'dist').rglob('*')):
        if file.is_file():
            archive.write(file, file.relative_to(root / 'dist'))

allowed = ['dist', 'scripts', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'package.json', '.gitignore']
with zipfile.ZipFile(args.output / 'paper-recipe-source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in allowed:
        path = root / name
        files = sorted(path.rglob('*')) if path.is_dir() else [path]
        for file in files:
            if file.is_file() and '__pycache__' not in file.parts:
                archive.write(file, Path('paper-recipe') / file.relative_to(root))
print('Created paper-recipe-web.zip and paper-recipe-source.zip')
