// Trigger the announcement email to all users immediately
console.log("🚀 Triggering announcement email campaign to ALL USERS...");

fetch('https://fscendubnktdtmnxiipk.supabase.co/functions/v1/send-announcement-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY'
  },
  body: JSON.stringify({
    preview_only: false
  })
})
.then(response => {
  console.log("📧 Response status:", response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Email campaign result:', data);
  if (data.success) {
    console.log(`🎉 Successfully sent to ${data.stats?.success_count || 0} users!`);
    console.log(`❌ Failed to send to ${data.stats?.failure_count || 0} users`);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});