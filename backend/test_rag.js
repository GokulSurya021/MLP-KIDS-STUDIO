const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function runVerification() {
  const form = new FormData();
  form.append('file', fs.createReadStream('../sample_studio_guide.pdf'));
  
  console.log('=== 1. Uploading PDF ===');
  const up = await axios.post('http://localhost:5000/api/rag/upload', form, { headers: form.getHeaders() });
  console.log('Upload Status:', up.data.success, 'Indexed:', up.data.data.filename);

  console.log('\n=== 2. Grounded Question 1: VIP cost ===');
  const q1 = await axios.post('http://localhost:5000/api/rag/query', { question: 'What is the annual VIP membership cost?' });
  console.log('Answer 1:', q1.data.answer);
  console.log('Sources 1 count:', q1.data.sources.length);
  if (q1.data.sources.length) {
    console.log('Source doc:', q1.data.sources[0].document, '| chunk:', q1.data.sources[0].chunk);
  }

  console.log('\n=== 3. Grounded Question 2: Canvas print discount ===');
  const q2 = await axios.post('http://localhost:5000/api/rag/query', { question: 'What discount do members get on canvas prints?' });
  console.log('Answer 2:', q2.data.answer);
  console.log('Sources 2 count:', q2.data.sources.length);

  console.log('\n=== 4. Out-of-Context Question 1: Speed of light ===');
  const q3 = await axios.post('http://localhost:5000/api/rag/query', { question: 'What is the speed of light in vacuum?' });
  console.log('Answer 3:', q3.data.answer);
  console.log('Sources 3 count:', q3.data.sources.length);

  console.log('\n=== 5. Out-of-Context Question 2: Sourdough bread ===');
  const q4 = await axios.post('http://localhost:5000/api/rag/query', { question: 'How do I bake sourdough bread?' });
  console.log('Answer 4:', q4.data.answer);
  console.log('Sources 4 count:', q4.data.sources.length);
}

runVerification().catch(console.error);
