(function(){
  var form = document.getElementById('contact-form');
  if(!form) return;
  var status = document.getElementById('cf-status');
  var submitBtn = form.querySelector('.form-submit');
  var webhookB64 = 'aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTUyNzU4MjUwNTA5MDI4NTY1MS9OMXU4RWw3X0d6UDZiTVFyeUl5dWNLeXphQ0N0cW9JbG92ZnY0MGJLd2w3MUdhUnhiNkZxcmVOdndYUUZvTUlzMUdzOA==';
  var COOLDOWN_MS = 45000;
  var COOLDOWN_KEY = 'fmc_contact_last_submit';

  function showStatus(msg, type){
    status.textContent = msg;
    status.className = 'form-status show ' + type;
  }

  function msSinceLastSubmit(){
    var last = Number(sessionStorage.getItem(COOLDOWN_KEY) || 0);
    return Date.now() - last;
  }

  function applyCooldownLock(remainingMs){
    submitBtn.disabled = true;
    submitBtn.textContent = 'Please wait ' + Math.ceil(remainingMs / 1000) + 's...';
    setTimeout(function(){
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }, remainingMs);
  }

  var elapsed = msSinceLastSubmit();
  if(elapsed < COOLDOWN_MS){
    applyCooldownLock(COOLDOWN_MS - elapsed);
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();

    if(form.company.value){
      showStatus("Thanks — we'll be in touch soon.", 'success');
      form.reset();
      return;
    }

    var remaining = COOLDOWN_MS - msSinceLastSubmit();
    if(remaining > 0){
      showStatus('Please wait a moment before sending another message.', 'error');
      applyCooldownLock(remaining);
      return;
    }

    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var phone = form.phone.value.trim();
    var message = form.message.value.trim();

    if(!name || !email || !message){
      showStatus('Please fill in your name, email, and message.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    fetch(atob(webhookB64), {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        embeds: [{
          title: 'New website contact',
          color: 13144622,
          fields: [
            {name: 'Name', value: name},
            {name: 'Email', value: email},
            {name: 'Phone', value: phone || 'Not provided'},
            {name: 'Message', value: message.slice(0, 1000)}
          ],
          timestamp: new Date().toISOString()
        }]
      })
    }).then(function(res){
      if(res.ok){
        showStatus("Message sent — we'll reply by email soon.", 'success');
        form.reset();
        sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
        applyCooldownLock(COOLDOWN_MS);
      } else {
        throw new Error('Request failed');
      }
    }).catch(function(){
      showStatus('Something went wrong. Please email hello@firstmatecyber.com directly instead.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    });
  });
})();
