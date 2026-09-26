#!/usr/bin/env bash
# Compiles resume/saif-ur-rehman-resume.tex to public/cv/saif-ur-rehman-resume.pdf.
# Run from anywhere; paths are resolved relative to this script.
set -euo pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out="$dir/../public/cv"
mkdir -p "$out"

if ! command -v pdflatex >/dev/null 2>&1; then
  echo "pdflatex not found. Install TeX Live (scheme-basic plus xcharter, titlesec," >&2
  echo "enumitem, hyperref, microtype) or run this on a machine that has it." >&2
  exit 1
fi

cd "$dir"
# Twice, so hyperref's cross-references (none here, but harmless) settle.
pdflatex -interaction=nonstopmode -halt-on-error -output-directory "$dir" saif-ur-rehman-resume.tex >/tmp/resume-build.log 2>&1 \
  || { echo "pdflatex failed; see /tmp/resume-build.log" >&2; tail -40 /tmp/resume-build.log >&2; exit 1; }
pdflatex -interaction=nonstopmode -halt-on-error -output-directory "$dir" saif-ur-rehman-resume.tex >/tmp/resume-build.log 2>&1

mv "$dir/saif-ur-rehman-resume.pdf" "$out/saif-ur-rehman-resume.pdf"
rm -f "$dir"/saif-ur-rehman-resume.{aux,log,out}

echo "wrote $out/saif-ur-rehman-resume.pdf"
