$(function () {

   //global variable used to store array content
   //here it is used for storring json data
	var products = [],

	   //filter is used for checkbox element
		filters = {};

	//	Checkbox filtering
     //checkbox classes
	 //event handling
	var checkboxes = $('.all-products input[type=checkbox]');

	checkboxes.click(function () {
       //this specifies for checked item
		var that = $(this),
		//name specifies for manufacture or storage or os or camera
			specName = that.attr('name');
console.log(specName);
		// when checkbox is checked then products should be filtered
		if(that.is(":checked")) {

			// if filter of specification is empty
			if(!(filters[specName] && filters[specName].length)){
				console.log("*****")
				//then we are making an array 
				//since more than one same specification can be checked 
				filters[specName] = [];
			}

			//we are  pushing the filter element to array
			filters[specName].push(that.val());

			// changing param query;
			createQueryHash(filters);

		}

		// unchecked we are removing the filter products
		if(!that.is(":checked")) {

			if(filters[specName] && filters[specName].length && (filters[specName].indexOf(that.val()) != -1)){

				//index of unchecked element in filter
				var index = filters[specName].indexOf(that.val());

				// Remove it.
				filters[specName].splice(index, 1);

				
				// delete the whole if that is the last element
				if(!filters[specName].length){
					delete filters[specName];
				}

			}

			// Change the param query
			createQueryHash(filters);
		}
	});

	// after clearing filters url is changed to hash
	$('.filters button').click(function (e) {
		e.preventDefault();
		window.location.hash = '#';
	});


	// single product page

	var singleProductPage = $('.single-product');

	singleProductPage.on('click', function (e) {
       //checking whether it has visible class
		if (singleProductPage.hasClass('visible')) {
            //e.target when click anywhere in page
			var clicked = $(e.target);

			// If the close button or the background are clicked go to the previous page.
			if (clicked.hasClass('close') || clicked.hasClass('overlay')) {
				//  url hash is changed with last used filters.
				createQueryHash(filters);
			}

		}

	});


	


	// get data about  products from products.json.
	$.getJSON( "products.json", function( data ) {

		// write the data into global variable.
		products = data;

		// call a function to create HTML for all the products.
		generateAllProductsHTML(products);

		// manually trigger a hashchange to start the app.
		$(window).trigger('hashchange');
	});


	// an event handler with calls the render function on every hashchange.
	// he render function will show the appropriate content of out page.
	$(window).on('hashchange', function(){
		console.log("hashchange")
		render(decodeURI(window.location.hash));
	});

	function render(url) {

		// Get the keyword from the url param.
		var temp = url.split('/')[0];

		// hiding all the products
		$('.main-content .page').removeClass('visible');


		var	map = {
            //with after url 
			// The "Homepage".
			'': function() {

				// Clear the filters object, uncheck all checkboxes, show all the products
				filters = {};
				checkboxes.prop('checked',false);

				renderProductsPage(products);
			},

			// Single Products page.
			'#product': function() {

				// Get the index of which product we want to show and call the appropriate function.
				var index = url.split('#product/')[1].trim();
                //to display single product preview page function call;
				renderSingleProductPage(index, products);
			},

			// to display param query of filter
			'#filter': function() {

				// url  string after the '#filter/' keyword. Call the filtering function.
				url = url.split('#filter/')[1].trim();

				// Try and parse the filters object from the query string.
				try {
					filters = JSON.parse(url);
				}
					// If it isn't a valid json, go back to homepage with # .
				catch(err) {
					window.location.hash = '#';
					return;
				}

				renderFilterResults(filters, products);
			}

		};

		// Execute the needed function depending on the url keyword .
		if(map[temp]){
			map[temp]();
		}
		// If the keyword isn't listed in the above - rendering the error page.
		else {
			renderErrorPage();
		}

	}

	// It fills up and display the products list via a handlebars template.
	function generateAllProductsHTML(data){
		console.log(data);

		var list = $('.all-products .products-list');

		var theTemplateScript = $("#products-template").html();
		//Compile the template​
		var theTemplate = Handlebars.compile (theTemplateScript);
		//appending to html with json data
		list.append (theTemplate(data));


		// Each products has a data-index attribute.
		// On click change the url hash to open up a preview for this product only.
		list.find('li').on('click', function (e) {
			e.preventDefault();

			var productIndex = $(this).data('index');

			window.location.hash = 'product/' + productIndex;
		})
	}

	// this function receives an object containing all the product we want to show.
	//after filtering
	function renderProductsPage(data){

		var page = $('.all-products'),
			allProducts = $('.all-products .products-list > li');

		// hide all the products in the products list .
		allProducts.addClass('hidden');

		// iterate over all of the products.
		// if their ID is somewhere in the data object remove the hidden class to reveal them.
		//only filtered elements are displayed
		allProducts.each(function () {

			var that = $(this);

			data.forEach(function (item) {
				if(that.data('index') == item.id){
					that.removeClass('hidden');
				}
			});
		});

		// show the page itself.
		// the render function hides all pages so we need to show the one we want.
		//with less opacity
		page.addClass('visible');

	}


	// opens up a preview for one of the products.
	// its parameters are an index from the hash and the products object.
	function renderSingleProductPage(index, data){

		var page = $('.single-product'),
			container = $('.preview-large');

		// find the wanted product by iterating the data object and searching for the chosen index.
		if(data.length){
			data.forEach(function (item) {
				if(item.id == index){
					// Populate '.preview-large' with the chosen product's data.
					//displays the preview page
					container.find('h3').text(item.name);
					container.find('img').attr('src', item.image.large);
					container.find('p').text(item.description);
				}
			});
		}

		// Show the page.
		page.addClass('visible');

	}

	// find and render the filtered data results. arguments are:
	// filters - our global variable - the object with arrays about what we are searching for.
	// products - an object with the full products list..
	function renderFilterResults(filters, products){

			// this array contains all the possible filter criteria.
		var criteria = ['manufacturer','storage','os','camera'],
			results = [],
			isFiltered = false;

		// uncheck all the checkboxes.
		// we will be checking them again one by one.
		checkboxes.prop('checked', false);


		criteria.forEach(function (c) {

			// check if each of the possible filter criteria is actually in the filters object.
			if(filters[c] && filters[c].length){


				// after we've filtered the products once, we want to keep filtering them.
				// that's why we make the object we search in (products) to equal the one with the results.
				// then the results array is cleared, so it can be filled with the newly filtered data.
				if(isFiltered){
					products = results;
					results = [];
				}


				// in these nested 'for loops' we will iterate over the filters and the products
				// and check if they contain the same values .

				// iterate over the entries inside filters.criteria.
				filters[c].forEach(function (filter) {

					// iterate over the products.
					products.forEach(function (item){

						// if the product has the same specification value as the one in the filter
						// push it inside the results array and mark the isFiltered flag true.

						if(typeof item.specs[c] == 'number'){
							if(item.specs[c] == filter){
								results.push(item);
								isFiltered = true;
							}
						}

						if(typeof item.specs[c] == 'string'){
							if(item.specs[c].toLowerCase().indexOf(filter) != -1){
								results.push(item);
								isFiltered = true;
							}
						}

					});

					// Here we can make the checkboxes representing the filters true,
					// keeping the app up to date.
					if(c && filter){
						$('input[name='+c+'][value='+filter+']').prop('checked',true);
					}
				});
			}

		});

		// call the renderProductsPage.
		// as it's argument give the object with filtered products.
		renderProductsPage(results);
	}


	// shows the error page.
	function renderErrorPage(){
		var page = $('.error');
		page.addClass('visible');
	}

	// get the filters object, turn it into a string and write it into the hash.
	function createQueryHash(filters){

		// here we check if filters isn't empty.
		if(!$.isEmptyObject(filters)){
			// stringify the object via JSON.stringify and write it after the '#filter' keyword.
			window.location.hash = '#filter/' + JSON.stringify(filters);
		}
		else{
			// if it's empty change the hash to '#' the homepage.
			window.location.hash = '#';
		}

	}

});
