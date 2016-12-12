/* global $, document */
/* global randStr, toTitleCase, connect_to_server, showHomePanel, closeNoticePanel, openNoticePanel*/
/* exported record_company, autoCloseNoticePanel, start_up*/
var ws = {};
var bgcolors = ['whitebg', 'blackbg', 'redbg', 'greenbg', 'bluebg', 'purplebg', 'pinkbg', 'orangebg', 'yellowbg'];
var autoCloseNoticePanel = null;
var known_companies = {};
var start_up = true;

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
	$('input[name="name"]').val('r' + randStr(6));
	
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$('#createMarbleButton').click(function(){
		console.log('creating marble');
		var obj = 	{
						type: 'create',
						name: $('input[name="name"]').val().replace(' ', ''),
						color: $('.colorSelected').attr('color'),
						size: $('select[name="size"]').val(),
						username: $('select[name="user"]').val(),
						company: $('input[name="company"]').val(),
						v: 1
					};
		if(obj.username && obj.name && obj.color){
			console.log('creating marble, sending', obj);
			ws.send(JSON.stringify(obj));

			$('#createPanel').fadeOut();
			$('#tint').fadeOut();
			showHomePanel();
			$('.colorValue').html('Color');											//reset
			for(var i in bgcolors) $('.createball').removeClass(bgcolors[i]);		//reset
			$('.createball').css('border', '2px dashed #fff');						//reset
		}
		return false;
	});

	//fix marble owner panel (don't filter/hide it)
	$(document).on('click', '.marblesFix', function(){
		if($(this).parent().parent().hasClass('marblesFixed')){
			$(this).parent().parent().removeClass('marblesFixed');
		}
		else{
			$(this).parent().parent().addClass('marblesFixed');
		}
	});

	//marble color picker
	$(document).on('click', '.colorInput', function(){
		$('.colorOptionsWrap').hide();											//hide any others
		$(this).parent().find('.colorOptionsWrap').show();
	});
	$(document).on('click', '.colorOption', function(){
		var color = $(this).attr('color');
		var html = '<span class="fa fa-circle colorSelected ' + color + '" color="' + color + '"></span>';
		
		$(this).parent().parent().find('.colorValue').html(html);
		$(this).parent().hide();

		for(var i in bgcolors) $('.createball').removeClass(bgcolors[i]);		//remove prev color
		$('.createball').css('border', '0').addClass(color + 'bg');				//set new color
	});
	
	//drag and drop marble
	$('#trashbin').droppable({drop:
		function( event, ui ) {
			var id = $(ui.draggable).attr('id');
			if(id){
				console.log('removing marble', id);
				var obj = 	{
								type: 'delete_marble',
								name: id,
								v: 1
							};
				ws.send(JSON.stringify(obj));
				$(ui.draggable).fadeOut();
				setTimeout(function(){
					$(ui.draggable).remove();
				}, 1500);
				showHomePanel();
			}
		}
	});

	//username/company search
	$('#searchUsers').keyup(function(){
		var count = 0;
		var input = $(this).val().toLowerCase();
		for(var i in known_companies){
			known_companies[i].visible = 0;
		}
		if(input === '') {
			$('.marblesWrap').show();
			count = $('#totalUsers').html();
			$('.companyPanel').fadeIn();
			for(i in known_companies){
				known_companies[i].visible = known_companies[i].count;
				$('.companyPanel[company="' + i + '"]').find('.companyVisible').html(known_companies[i].visible);
				$('.companyPanel[company="' + i + '"]').find('.companyCount').html(known_companies[i].count);
			}
		}
		else{
			var parts = input.split(',');
			console.log('searching on', parts);

			$('.marblesWrap').each(function(){
				var full_owner = $(this).attr('full_owner');
				var company = $(this).attr('company');
				if(full_owner){
					full_owner = full_owner.toLowerCase();
					var show = false;

					for(var x in parts){
						if(parts[x].trim() === '') continue;
						if(full_owner.indexOf(parts[x].trim()) >= 0 || $(this).hasClass('marblesFixed')) {
							count++;
							show = true;
							known_companies[company].visible++;
							break;
						}
					}

					if(show) $(this).show();
					else $(this).hide();
				}
			});
			for(i in known_companies){
				$('.companyPanel[company="' + i + '"]').find('.companyVisible').html(known_companies[i].visible);
				if(known_companies[i].visible === 0) {
					console.log('hiding company', i);
					$('.companyPanel[company="' + i + '"]').fadeOut();
				}
				else{
					$('.companyPanel[company="' + i + '"]').fadeIn();
				}
			}
		}
		//user count
		$('#foundUsers').html(count);
	});

	//login events
	$('#whoAmI').click(function(){													//drop down for login
		if($('#userSelect').is(':visible')){
			$('#userSelect').fadeOut();
			$('#carrot').removeClass('fa-angle-up').addClass('fa-angle-down');
		}
		else{
			$('#userSelect').fadeIn();
			$('#carrot').removeClass('fa-angle-down').addClass('fa-angle-up');
		}
	});

	//open create marble panel
	$(document).on('click', '.addMarble', function(){
		$('#tint').fadeIn();
		$('#createPanel').fadeIn();
		var company = $(this).parents('.innerMarbleWrap').parents('.marblesWrap').attr('company');
		var username = $(this).parents('.innerMarbleWrap').parents('.marblesWrap').attr('username');
		$('select[name="user"]').html('<option value="' + username +'">' + toTitleCase(username) + '</option>');
		$('input[name="company"]').val(company);
	});

	//close create marble panel
	$('#tint').click(function(){
		if($('#startUpPanel').is(':visible')) return;
		$('#createPanel, #tint').fadeOut();
	});

	//notification drawer
	$('#notificationHandle').click(function(){
		if($('#noticeScrollWrap').is(':visible')){
			closeNoticePanel();
		}
		else{
			openNoticePanel();
		}
	});

	//hide a notification
	$(document).on('click', '.closeNotification', function(){
		$(this).parents('.notificationWrap').fadeOut();
	});
});