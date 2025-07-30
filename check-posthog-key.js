// Check if PostHog key exists in Supabase secrets
fetch('https://fscendubnktdtmnxiipk.supabase.co/functions/v1/secrets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzY2VuZHVibmt0ZHRtbnhpaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODEzMTcsImV4cCI6MjA2ODY1NzMxN30.F4TeAOAW2R_8di-9B-oz7jodfb9SS3HE1RAyeJGgaMY'
  },
  body: JSON.stringify({ name: 'POSTHOG_API_KEY' })
})
.then(response => response.json())
.then(data => {
  if (data.value) {
    console.log('✅ PostHog key found:', data.value.substring(0, 12) + '...');
  } else {
    console.log('❌ PostHog key not found');
  }
})
.catch(error => {
  console.error('❌ Error checking PostHog key:', error);
});