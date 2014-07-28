$(function() {
	// $(".sider-affix").affix({
	// 	offset: {
	// 		top: 50,
	// 		bottom: function() {
	// 			return (this.bottom = $('#comments').outerHeight(true) + $('#footer').outerHeight(true))
	// 		}
	// 	}
	// });

	console.log('g');
	$('[data-toggle=popover]').popover({
		html: true,
  		trigger: 'hover'

	})
	 $('[data-toggle="tooltip"]').tooltip();
})