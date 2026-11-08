base='/home/claude/v3/'
css=open(base+'src/styles.css').read()
body=open(base+'src/body.html').read()
order=[l.strip() for l in open(base+'src/ORDER') if l.strip()]
js='\n'.join(open(base+'src/'+f).read() for f in order)
assert '</script' not in js
out=f'''<title>RoomRecall Night Build</title>
<meta name="description" content="Every course gets a house, every fact gets a place.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Nunito:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap">
<style>
{css}
</style>
{body}
<script>
{js}
</script>
'''
open(base+'index.html','w').write(out)
open(base+'test.html','w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}img{max-width:100%}body{margin:0}</style></head><body>'+out+'</body></html>')
open(base+'all.js','w').write(js)
print(len(out))
