// server.js
console.warn('ATTENTION: GITHUB_TOKEN, GITHUB_OWNER ou GITHUB_REPO non configurés. Le commit GitHub échouera.');



const octokit = new Octokit({ auth: GITHUB_TOKEN });


async function getFileSha(path){
try{
const { data } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path, ref: BRANCH });
return data.sha;
} catch(err){
return null; // fichier peut ne pas exister
}
}


async function upsertFile(path, contentBuffer, message){
const content = base64.encode(contentBuffer);
const sha = await getFileSha(path);
const params = { owner: OWNER, repo: REPO, path, message, content, branch: BRANCH };
if(sha) params.sha = sha;
return octokit.repos.createOrUpdateFileContents(params);
}


function toCSVRow(obj){
// basic escaping
const quote = (s='') => '"'+String(s).replace(/"/g,'""')+'"';
const keys = ['timestamp','age','gender','mood','support','free'];
const row = keys.map(k => quote(obj[k]||'')).join(',');
return row + '\n';
}


app.post('/submit', async (req,res)=>{
try{
const data = req.body;
const now = new Date().toISOString();
const obj = { timestamp: now, age: data.age, gender: data.gender, mood: data.mood, support: data.support, free: data.free };


// read existing file if present
const path = 'results/sondage.csv';
let existing = '';
try{
const resContent = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path, ref: BRANCH });
const enc = resContent.data.content;
existing = Buffer.from(enc, 'base64').toString('utf8');
} catch(e){
// file not found -> create with header
existing = 'timestamp,age,gender,mood,support,free\n';
}


const newRow = toCSVRow(obj);
const newContent = existing + newRow;


await upsertFile(path, Buffer.from(newContent,'utf8'), 'Ajout réponse sondage — ' + now);


res.json({ ok:true });
} catch(err){
console.error(err);
res.status(500).send(String(err));
}
});


const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('Server running on', port));