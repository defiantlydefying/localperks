import test from 'node:test';
import assert from 'node:assert/strict';
import {safeURL,escapeHTML,parseBrief,briefPrompt,reviewPrompt,parseScope} from '../dist/domain.mjs';
test('unsafe links and user markup cannot become executable content',()=>{
 assert.equal(safeURL('javascript:alert(1)'),null);assert.equal(safeURL('data:text/html,hello'),null);assert.equal(safeURL('https://example.com/work'),'https://example.com/work');
 assert.equal(escapeHTML('<script>"hi"</script>'),'&lt;script&gt;&quot;hi&quot;&lt;/script&gt;');
});
test('model output must contain a valid editable brief',()=>{
 assert.throws(()=>parseBrief('No result'));assert.throws(()=>parseBrief('{"title":"Hello","description":"x","deliverables":[]}'));
 const b=parseBrief('```json\n{"title":"A visit","description":"A useful brief","deliverables":["One reel"],"questions":["Usage rights?"]}\n```');assert.equal(b.title,'A visit');assert.deepEqual(b.questions,['Usage rights?']);
});
test('prompts preserve exact reward and prohibit unsupported verification claims',()=>{
 assert.match(briefPrompt({reward:'$75 + coffee'}),/\$75 \+ coffee/);assert.match(briefPrompt({}),/Do not invent/);
 assert.match(reviewPrompt({deliverables:['One reel']},'hello'),/cannot view the URL/);assert.match(reviewPrompt({deliverables:[]},'hello'),/Never approve a payout/);
});
test('scope parser accepts only known verdicts and trims extra asks',()=>{assert.equal(parseScope('Here: {"verdict":"unclear","explanation":"Not covered.","outOfScope":["a","",5]}').outOfScope.length,1);assert.throws(()=>parseScope('{"verdict":"yes","explanation":"x"}'));});
