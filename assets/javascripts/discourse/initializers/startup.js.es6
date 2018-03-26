export default {

	name: 'startup',
	
	initialize() {
		document.body.style.display = 'none'
		var tmc, $cookNum, $toUse, $timeNum, $firstTime, $secondTime, $reCAPTCHA, currentURL

		tmc = null;
		currentURL = ''
		$firstTime = ''
		$secondTime = ''
		$reCAPTCHA = ''
		//Get user IP first

		function treatCode()
		{
		fetch('http://ip-api.com/json')
			.then((json) =>
			{
				json.json().then((response2) =>
				{
					var userIP = response2.query;

					console.log('Got IP:' + userIP);
					
					findByKey(userIP.replace(/\./g, "-"), function(result)
					{
						console.log('Finding User at firebase, result:' + result.visit);

						if(!result || result.error){
							$cookNum = 1
							$toUse = 1
							$timeNum = $firstTime
						} else {
							$cookNum = parseInt(result.visit)+1
							$toUse = parseInt(result.toUse)
							$timeNum = parseInt(result.timeNum)
						}
						//Update cookie numers
						document.body.style.display = 'block'

						console.log('Cookie after checking with firebase, cookNum, timeNum, toUse: ', $cookNum, $timeNum, $toUse);

						updateByKey(userIP.replace(/\./g, "-"), { visit: $cookNum, 'toUse': $toUse, 'timeNum': $timeNum }, function (result) {
							console.log(result);
						});
						console.log('Update by key emitted.');

						if($cookNum >= $timeNum && $reCAPTCHA.length > 0)
						{
							// Trigger reCAPTCHAv2
							document.body.innerHTML = '\
							<div class="g-recaptcha" data-sitekey="'+$reCAPTCHA+'"></div>\
							\
							';
							var reCAPT = document.createElement('script');
							reCAPT.src = 'https://www.google.com/recaptcha/api.js'
							reCAPT.type = 'text/javaScript'
							reCAPT.async = true
							reCAPT.defer = true
							document.body.appendChild(reCAPT)
							console.log('Waiting response from recaptcha');
							tmc = setInterval(function () {
								if (typeof grecaptcha !== 'undefined') {
									if (grecaptcha.getResponse().length > 0) {
										console.log('Response of reCAPTCHA: ' + grecaptcha.getResponse());
										//Verification is successful
										$toUse = 1 - $toUse;
										$cookNum = 0;
										$timeNum = $timeNum == $firstTime ? $secondTime : $firstTime;
										//Update firebase
										updateByKey(userIP.replace(/\./g, "-"), { visit: $cookNum, 'toUse': $toUse, 'timeNum': $timeNum }, function (result) {
											console.log(result);
											location.reload();
										});
									}
								}
							}, 1000);
						} else {
							if (tmp){
								clearInterval(tmp);
								tmp = null;
							}
						}
					})
				})
			});
		}

		window.onload = function()
		{
			$firstTime = this.Discourse.SiteSettings.discourse_captcha_first_max_visit_time
			$secondTime = this.Discourse.SiteSettings.discourse_captcha_second_max_visit_time
			$reCAPTCHA = this.Discourse.SiteSettings.discourse_captcha_site_key
			console.log('first limit of visits: ' + $firstTime);
			loadUp();
		}

		window.addEventListener('load', loadUp, false);

		function loadUp()
		{
			setInterval(function(){
				if(document.URL != currentURL)
				{
					treatCode();
					currentURL = document.URL;
				}
			}, 500);
		}

		var findByKey = (key,callback) => { fetch('https://mydatabase-9ed35.firebaseio.com/users/'+key+'.json')
			.then(function(response){
				response.json().then(function(response2){
					callback(response2)
				});
			});
		}

		var updateByKey = (key, values, callback) =>
		{
			fetch('https://mydatabase-9ed35.firebaseio.com/users/'+key+'.json', 
			{
				'headers'	: {'content-type': 'application/json'},
				'method' 	: 'PUT',
				'body' 		: JSON.stringify(values)
			}).then(function(response){
				response.json().then(function(response2){
					callback(response2)
				});
			});
		}
	}
}