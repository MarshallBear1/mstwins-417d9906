// Trigger the announcement email immediately
console.log("🚀 Triggering announcement email campaign...");

fetch('https://fscendubnktdtmnxiipk.supabase.co/functions/v1/send-announcement-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY'
  },
  body: JSON.stringify({})
})
.then(response => {
  console.log("📧 Response status:", response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Email campaign result:', data);
})
.catch(error => {
  console.error('❌ Error:', error);
});