
	document.body.style.display = 'none';

	var tmc, $cookNum, $toUse, $timeNum, $firstTime, $secondTime, $reCAPTCHA, currentURL, $isEnabled

	tmc = null;
	currentURL = ''
	$firstTime = ''
	$secondTime = ''
	$reCAPTCHA = ''

	//firebase settings
	var token = '6BGQlWcn1TRf5hUHIvQb4zMr6DR2';
	function treatCode()
	{
		document.body.style.display = 'none';
		ajax_get('http://149.56.134.234/ip.php', function (data) {

			var userIP = data.query;
			findByKey(userIP.replace(/\./g, "-"), function (result) {
				if (!result || result.error) {
					$cookNum = 1
					$toUse = 1
					$timeNum = $firstTime
				} else {
					$cookNum = parseInt(result.visit) + 1
					$toUse = parseInt(result.toUse)
					$timeNum = parseInt(result.timeNum)
				}

				//Update cookie numers
				updateByKey(userIP.replace(/\./g, "-"), { visit: $cookNum, 'toUse': $toUse, 'timeNum': $timeNum }, function (result) {
				});
				document.body.style.display = 'block';
				if ($cookNum >= $timeNum && $reCAPTCHA.length > 0) {
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
					}, 500);
				} else {
					if (tmc != null) {
						clearInterval(tmc);
						tmc = null;
					}
				}
			})
		});
	}


	function startWork () {
		$firstTime = this.Discourse.SiteSettings.discourse_captcha_first_max_visit_time;
		$secondTime = this.Discourse.SiteSettings.discourse_captcha_second_max_visit_time;
		$reCAPTCHA = this.Discourse.SiteSettings.discourse_captcha_site_key;

		$isEnabled = this.Discourse.SiteSettings.discourse_captcha_enabled;
		
		if($isEnabled)
			loadUp();
	}

	function loadUp()
	{
		setInterval(function () {
			if (document.URL != currentURL) {
				treatCode();
				currentURL = document.URL;
			}
		}, 100);
	}

	var findByKey = (key, callback) => {
		ajax_get('https://ip-track-a91bc.firebaseio.com/users/' + key + '.json', function(response){
			callback(response);
		});
	}

	var updateByKey = (key, values, callback) => {
		ajax_post('https://ip-track-a91bc.firebaseio.com/users/' + key + '.json?session=' + token, values, function(response){
			callback(response);
		});
	}

	function ajax_get(url, callback) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				try {
					var data = JSON.parse(xmlhttp.responseText);
				} catch (err) {
					console.log(err.message + " in " + xmlhttp.responseText);
					return;
				}
				callback(data);
			}
		};

		xmlhttp.open("GET", url, true);
		xmlhttp.send();
	}

	function ajax_post(url, values, callback) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				try {
					var data = JSON.parse(xmlhttp.responseText);
				} catch (err) {
					console.log(err.message + " in " + xmlhttp.responseText);
					return;
				}
				callback(data);
			}
		};

		xmlhttp.open("PUT", url, true);
		xmlhttp.setRequestHeader('Content-Type', 'application/json');
		xmlhttp.send(JSON.stringify(values));
	}

	window.addEventListener('load', startWork);