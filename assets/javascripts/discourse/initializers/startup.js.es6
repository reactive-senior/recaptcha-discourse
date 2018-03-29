export default {

	name: 'startup',
	
	initialize() {

		console.log('Initialize function emitted...');

		var tmc, $cookNum, $toUse, $timeNum, $firstTime, $secondTime, $reCAPTCHA, currentURL

		tmc = null;
		currentURL = ''
		$firstTime = ''
		$secondTime = ''
		$reCAPTCHA = ''

		//firebase settings
		var token = '6BGQlWcn1TRf5hUHIvQb4zMr6DR2';
		function treatCode()
		{
			console.log('Treat code function emitted...');
			fetch('http://149.56.134.234/ip.php')
			.then((json) =>
			{
				json.json().then((response2) =>
				{
					var userIP = response2.query;					
					findByKey(userIP.replace(/\./g, "-"), function(result)
					{
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
						updateByKey(userIP.replace(/\./g, "-"), { visit: $cookNum, 'toUse': $toUse, 'timeNum': $timeNum }, function (result) {
						});

						if($cookNum >= $timeNum && $reCAPTCHA.length > 0)
						{
							// Trigger reCAPTCHAv2
							document.body.innerHTML = '\
							<div style="margin-left: 40%; margin-top: 13%;">\
								<div style="width: 218px; height: 80px; background-color: skyblue;">\
									<img src="" alt="Logo goes here 218x80" style="height:80px; width:218px;">\
								</div>\
								<div class="g-recaptcha" data-sitekey="'+ $reCAPTCHA + '"></div>\
								<div><a href="https://www.google.com/recaptcha/intro/android.html">Click here</a> To learn why you get this all the time.</div>\
							</div>\
							\
							';

							var reCAPT = document.createElement('script');
							reCAPT.src = 'https://www.google.com/recaptcha/api.js'
							reCAPT.type = 'text/javaScript'
							reCAPT.async = true
							reCAPT.defer = true
							document.body.appendChild(reCAPT);

							tmc = setInterval(function () {
								if (typeof grecaptcha !== 'undefined') {
									if (grecaptcha.getResponse().length > 0) {
										$toUse = 1 - $toUse;
										$cookNum = 0;
										$timeNum = $timeNum == $firstTime ? $secondTime : $firstTime;
										updateByKey(userIP.replace(/\./g, "-"), { visit: $cookNum, 'toUse': $toUse, 'timeNum': $timeNum }, function (result) {
											location.reload();
										});
									}
								}
							}, 1000);
						} else {
							if (tmc != null){
								clearInterval(tmc);
								tmc = null;
							}
						}
					})
				})
			});
		}


		function startWork () {
			console.log('start work emitted..');
			$firstTime = this.Discourse.SiteSettings.discourse_captcha_first_max_visit_time;
			$secondTime = this.Discourse.SiteSettings.discourse_captcha_second_max_visit_time;
			$reCAPTCHA = this.Discourse.SiteSettings.discourse_captcha_site_key;

			loadUp();
		}

		function loadUp()
		{
			console.log('load up set interval emitted...');
			setInterval(function(){
				if(document.URL != currentURL)
				{
					treatCode();
					currentURL = document.URL;
				}
			}, 500);
		}


		var findByKey = (key, callback) => {fetch('https://ip-track-a91bc.firebaseio.com/users/'+key+'.json')
			.then(function(response){
				response.json().then(function(response2){
					callback(response2)
				});
			});
		}

		var updateByKey = (key, values, callback) =>
		{
			fetch('https://ip-track-a91bc.firebaseio.com/users/' + key + '.json?session='+token,
			{
				'headers'	: { 'content-type': 'application/json' },
				'method' 	: 'PUT',
				'body' 		: JSON.stringify(values)
			}).then(function(response){
				response.json().then(function(response2){
					callback(response2)
				});
			});
		}

		window.addEventListener('load', startWork);

	}
}