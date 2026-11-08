"""Builds the RoomRecall Source page: README plus every source file, readable and highlighted."""
import json, os, markdown
base = '/home/claude/v3/'
order = [l.strip() for l in open(base + 'src/ORDER') if l.strip()]
files = [('README.md', open(base + 'README.md').read())]
files += [('src/styles.css', open(base + 'src/styles.css').read()), ('src/body.html', open(base + 'src/body.html').read())]
files += [('src/' + f, open(base + 'src/' + f).read()) for f in order]
files += [('build.py', open(base + 'build.py').read())]
readme_html = markdown.markdown(files[0][1], extensions=['tables', 'fenced_code'])
data = json.dumps([{'path': p, 'text': t, **({'html': readme_html} if p == 'README.md' else {})} for p, t in files]).replace('</', '<\\/')
lines = sum(t.count('\n') for _, t in files)
html = open('/home/claude/source/template.html').read().replace('__DATA__', data).replace('__LINES__', f'{lines:,}'.replace(',', ' ')).replace('__FILES__', str(len(files)))
open('/home/claude/source/index.html', 'w').write(html)
print(len(files), 'files,', lines, 'lines')
