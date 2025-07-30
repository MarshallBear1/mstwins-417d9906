// Script to trigger the announcement email
fetch('https://fscendubnktdtmnxiipk.supabase.co/functions/v1/send-announcement-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY'
  },
  body: JSON.stringify({})
})
.then(response => response.json())
.then(data => {
  console.log('Email campaign triggered:', data);
})
.catch(error => {
  console.error('Error:', error);
});