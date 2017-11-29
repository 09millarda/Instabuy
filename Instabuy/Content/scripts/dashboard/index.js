// DEFINE VARS
var tableValues = {};     // will store table values
var filtersChanged = false;     // tracks whether any filters have been changed
var currSearchObjArrId;     // index of search object
var itemDetail = {};        // Stores detailed item specifics from the itemSearch eBay API call.
var activeSearches = [];        // Contains ids of the active search objects - Keys are item IDs
var currSelectedItem = "";      // Curr ID of selected item
var selectedItemRemember = {};  // Remembers the selected item of each search object
var intervalArr = {};       // stores all the timers that execute the api searches
var callQueue = [];     // holds the order of which to execute the searches

// Open filter config menu
$('#btn_configureFilters').on('click', function () {
    if ($(this).text() == "Configure Filters") {
        $(this).text("Close Filters Config");
        $('#filterConfigContainer').slideDown();
    } else {
        $(this).text("Configure Filters");
        $('#filterConfigContainer').slideUp();
    }
});

// check if configure button should be disabled
function shouldDisableConfig() {
    if (searchObjects.length == 0) {
        $('#searchControlRow button').each(function () {
            $(this).prop("disabled", true);
        });
        $('#filterConfigContainer').hide();
    } else {
        $('#searchControlRow button').each(function () {
            $(this).prop("disabled", false);
        });
    }
}

// when the document fully loads
$(document).ready(function () {
    $('#filterConfigContainer').hide();

    // if there are search objects
    if (searchObjects.length) {
        currSearchObjArrId = searchObjects[0].Id;
        changeSearchObject(currSearchObjArrId);
    }
    filtersChanged = false;     // No filters have been changed yet.
    shouldDisableConfig();
});

// Save filters for search object
$('form').submit(function (evt) {
    evt.preventDefault();
    $('.field-validation-error').each(function () {
        $(this).remove();
    });

    $('form .input-validation-error').each(function () {
        $(this).removeClass("input-validation-error");
    });

    // VALIDATION

    var isValid = true;

    // Name
    if ($('input[name="SearchObjectDto.Name"]').val().length > 30 || $('input[name="SearchObjectDto.Name"]').val().length == 0) {
        $('input[name="SearchObjectDto.Name"]').addClass("input-validation-error");
        $('input[name="SearchObjectDto.Name"]').after("<span class='field-validation-error'>Name must have between 1 and 30 characters</span>");
        isValid = false;
    }

    // Keywords
    if ($('textarea[name="SearchObjectDto.Keywords"]').val().length == 0 || $('textarea[name="SearchObjectDto.Keywords"]').val().length > 255) {
        $('textarea[name="SearchObjectDto.Keywords"]').addClass("input-validation-error");
        $('textarea[name="SearchObjectDto.Keywords"]').after("<span class='field-validation-error'>Keywords must be between 1 and 255 characters in length.</span>");
        isValid = false;
    }

    // Condition Type
    var validConditionTypes = [];
    $.each(conditionTypes, function (ind, val) {
        validConditionTypes.push(val.Id);
    });
    if ($.inArray(parseInt($('select[name="SearchObjectDto.ConditionTypeId"]').val()), validConditionTypes) == -1) {
        $('select[name="SearchObjectDto.ConditionTypeId"]').addClass("input-validation-error");
        $('select[name="SearchObjectDto.ConditionTypeId"]').after("<span class='field-validation-error'>This is an invalid condition type</span>");
        isValid = false;
    }

    // Minimum Price
    if ($('input[name="SearchObjectDto.MinPrice"]').val().length) {
        if ($('input[name="SearchObjectDto.MinPrice"]').val() > 2147483647 || $('input[name="SearchObjectDto.MinPrice"]').val() < 0) {
            $('input[name="SearchObjectDto.MinPrice"]').addClass("input-validation-error");
            $('input[name="SearchObjectDto.MinPrice"]').after("<span class='field-validation-error'>Must be between £0 and £2,147,483,647</span>");
            isValid = false;
        }
    }

    // Maximum Price
    if ($('input[name="SearchObjectDto.MaxPrice"]').val().length) {
        if ($('input[name="SearchObjectDto.MaxPrice"]').val() > 2147483647 || $('input[name="SearchObjectDto.MaxPrice"]').val() < 0) {
            $('input[name="SearchObjectDto.MaxPrice"]').addClass("input-validation-error");
            $('input[name="SearchObjectDto.MaxPrice"]').after("<span class='field-validation-error'>Must be between £0 and £2,147,483,647</span>");
            isValid = false;
        } else if ($('input[name="SearchObjectDto.MinPrice"]').val().length && (parseInt($('input[name="SearchObjectDto.MinPrice"]').val()) > parseInt($('input[name="SearchObjectDto.MaxPrice"]').val()))) {
            $('input[name="SearchObjectDto.MaxPrice"]').addClass("input-validation-error");
            $('input[name="SearchObjectDto.MaxPrice"]').after("<span class='field-validation-error'>Must be greater than Min Price</span>");
            isValid = false;
        }
    }

    // Listing Type
    var validListingTypes = [];
    $.each(listingTypes, function (ind, val) {
        validListingTypes.push(val.Id);
    });
    if ($.inArray(parseInt($('select[name="SearchObjectDto.ListingTypeId"]').val()), validListingTypes) == -1) {
        $('select[name="SearchObjectDto.ListingTypeId"]').addClass("input-validation-error");
        $('select[name="SearchObjectDto.ListingTypeId"]').after("<span class='field-validation-error'>This is an invalid listing type</span>");
        isValid = false;
    }

    // Min Feedback Score
    if ($('input[name="SearchObjectDto.FeedbackScoreMin"]').val().length) {
        if ($('input[name="SearchObjectDto.FeedbackScoreMin"]').val() < 0 || $('input[name="SearchObjectDto.FeedbackScoreMin"]').val() > 32767) {
            $('input[name="SearchObjectDto.FeedbackScoreMin"]').addClass("input-validation-error");
            $('input[name="SearchObjectDto.FeedbackScoreMin"]').after("<span class='field-validation-error'>Must be between 0 and 32,767</span>");
            isValid = false;
        }
    }

    // if form is valid
    if (isValid) {
        var Id, Name, Keywords, ConditionTypeId, ListingTypeId, FeedbackScoreMin, MinPrice, MaxPrice, ReturnsAcceptedOnly;

        // Collect data into a JSON object to be sent to EbayAPI controller
        var data = {};

        data.Name = $('input[name="SearchObjectDto.Name"]').val();
        data.Keywords = $('textarea[name="SearchObjectDto.Keywords"]').val();
        data.ConditionTypeId = parseInt($('select[name="SearchObjectDto.ConditionTypeId"]').val());
        data.ListingTypeId = parseInt($('select[name="SearchObjectDto.ListingTypeId"]').val());
        if ($('input[name="SearchObjectDto.FeedbackScoreMin"]').val().length) {
            data.FeedbackScoreMin = parseInt($('input[name="SearchObjectDto.FeedbackScoreMin"]').val());
        }
        if ($('input[name="SearchObjectDto.MinPrice"]').val().length) {
            data.MinPrice = parseInt($('input[name="SearchObjectDto.MinPrice"]').val());
        }
        if ($('input[name="SearchObjectDto.MaxPrice"]').val().length) {
            data.MaxPrice = parseInt($('input[name="SearchObjectDto.MaxPrice"]').val());
        }
        data.ReturnsAcceptedOnly = ('true' === $('input[name="SearchObjectDto_ReturnsAcceptedOnly"]').val());

        // if updating or creating a new form
        if (currSearchObjArrId == -1) {
            // NEW
            data.id = 0;
            $.ajax({
                url: "../api/searches/",
                method: "POST",
                headers: {
                    'Authorization': Cookies.get("token"),
                    'Content-Type': 'application/json'
                },
                dataType: 'json',
                data: JSON.stringify(data),
                success: function (data) {
                    // If the data is valid, update visual information
                    $('.header[data-id="-1"]').text(data.Name);
                    $('.header[data-id="-1"]').attr("data-id", (data.Id).toString());
                    currSearchObjArrId = data.Id;
                    filtersChanged = false;
                    searchObjects.push(data);
                },
                error: function (data) {
                    swal("Oops...", "Error: " + data.status + ". " + data.responseJSON.Message + ". Try refreshing the page.", "error");
                }
            });
        } else {
            // UPDATING
            if (filtersChanged) {
                if ($.inArray(currSearchObjArrId, activeSearches) == 0) {
                    swal("Oops...", "You need to stop searching to update the search object", "error")
                } else {
                    data.id = currSearchObjArrId;
                    $.ajax({
                        url: "../api/searches/",
                        method: "Put",
                        headers: {
                            'Authorization': Cookies.get("token"),
                            'Content-Type': 'application/json'
                        },
                        dataType: 'json',
                        data: JSON.stringify(data),
                        success: function (data) {
                            // update visual information
                            $('.header[data-id="' + currSearchObjArrId + '"]').text(data.Name);
                            filtersChanged = false;
                            $.each(searchObjects, function (ind, val) {
                                if (val.Id == currSearchObjArrId) {
                                    searchObjects[ind] = data;      // update data information for search query
                                    return;
                                }
                            });
                        },
                        error: function (data) {
                            swal("Oops...", "Error: " + data.status + ". " + data.responseJSON.Message + ". Try refreshing the page.", "error");
                        }
                    });
                }
            } else {
                swal("One Thing...", "You have not changed anything!", "info");
            }
        }
    }
});

// reset the form
$('#resetFilters').click(function (evt) {
    evt.preventDefault();
    $('form')[0].reset();
    $('.field-validation-error').each(function () {
        $(this).remove();
    });
    $('.input-validation-error').each(function () {
        $(this).removeClass("input-validation-error");
    });
});

// log off
$('#btn_logOff').click(function (evt) {
    Cookies.remove('token');    // remove token
});

// Allow numbers only for feedback score
$('.number').keypress(function (event) {
    var validChars = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57,]
    if (validChars.indexOf(event.keyCode) == -1) {
        return false;
    }
});

// On Search Object Changed
$('#searchesBar').on("click", ".header:not(#newSearch)", function (evt) {
    // only change if a non-selected header is clicked
    var id = parseInt($(this).attr("data-id"));
    if (id != currSearchObjArrId) {
        if (filtersChanged) {
            // any unsaved changes?
            filtersChangedAlert(id);
        } else {
            currSearchObjArrId = id;
            $('.header').each(function () {
                $(this).removeClass("active");
            });
            $(this).addClass("active");     // make header look active
            changeSearchObject(id);
        }

        // Reset form errors if they are visible
        $('.field-validation-error').each(function () {
            $(this).remove();
        });

        $('form .input-validation-error').each(function () {
            $(this).removeClass("input-validation-error");
        });
        changeStartButton();
    }
});

// On new search object clicked
$('#newSearch').click(function () {
    // check if there are already 3 searches
    if (searchObjects.length < 3) {
        if (filtersChanged) {
            swal({
                title: "One minute!",
                text: "You have some unsaved changes. Would you like to continue without saving them?",
                icon: "info",
                buttons: true,
                dangerMode: false
            }).then(function (choice) {
                if (choice) {
                    if (currSearchObjArrId == -1) {
                        $('.header[data-id="-1"]').remove();
                    }
                    $('#resetFilters').trigger("click");
                    $('.header').each(function () {
                        $(this).removeClass("active");
                    });
                    // Add new header and make it active
                    $('#newSearch').before('<div class="header active" data-id="-1" style="margin-right: 4px;">New Search Object</div>');
                    currSearchObjArrId = -1;
                    filtersChanged = true;
                    $('#filterConfigContainer').show();
                    $('#btn_configureFilters').text("Close Filters Config");
                    $('input[name="SearchObjectDto.Name"]').focus();
                    $('#searchControlRow button').each(function () {
                        $(this).prop("disabled", false);
                    });
                    changeStartButton();
                } else {
                    // do nothing
                }
            });
        } else {
            // reset form and show the configuration menu
            $('#resetFilters').trigger("click");
            $('.header').each(function () {
                $(this).removeClass("active");
            });
            // Add new header and make it active
            $('#newSearch').before('<div class="header active" data-id="-1" style="margin-right: 4px;">New Search Object</div>');
            currSearchObjArrId = -1;
            filtersChanged = true;
            $('#filterConfigContainer').show();
            $('#btn_configureFilters').text("Close Filters Config");
            $('input[name="SearchObjectDto.Name"]').focus();
            $('#searchControlRow button').each(function () {
                $(this).prop("disabled", false);
            });
            changeStartButton();
        }
    } else {
        swal("Oops...", "You are only allowed to have 3 search objects at this time.", "error");
    }
});

// on filter change set the filtersChanged to true
$('input').on("change", function (evt) {
    filtersChanged = true;
});

$('textarea').on("change", function (evt) {
    filtersChanged = true;
});

$('select').on("change", function (evt) {
    filtersChanged = true;
});

// alert the user that there are unsaved filters
function filtersChangedAlert(id) {
    swal({
        title: "One minute!",
        text: "You have some unsaved changes. Would you like to continue without saving them?",
        icon: "info",
        buttons: true,
        dangerMode: false
    }).then(function (choice) {
        if (choice) {
            $('.header').each(function () {
                $(this).removeClass("active");
            });
            $('.header[data-id="' + id + '"').addClass("active");
            if (currSearchObjArrId == -1) {
                $('.header[data-id="-1"').remove();
            }
            currSearchObjArrId = id;
            changeSearchObject(id);
        } else {
            // do nothing
        }
    });
}

// take care with changing the filter values and table values etc.
function changeSearchObject(id) {
    // reset the filterChanged bool
    filtersChanged = false;

    // reset filter menu
    $('form')[0].reset();

    // change the filter config information based on the current search object (first in the list)
    var currSearchObj = {};

    $.each(searchObjects, function (ind, val) {
        if (val.Id == id) {
            currSearchObj = searchObjects[ind];
            return;
        }
    });

    // change the filter values
    $.each(currSearchObj, function (ind, val) {
        // some of the dto vals are not changed in the form
        if ($("#SearchObjectDto_" + ind).length) {
            // if the value is not null
            if (val != null) {
                $("#SearchObjectDto_" + ind).val(val);
            }
        }

        if (ind == "ReturnsAcceptedOnly") {
            $("#SearchObjectDto_" + ind).prop("checked", val);
        }
    });

    // clear the table
    $('tbody').html("");

    // populate the table
    if (typeof tableValues[currSearchObjArrId] != "undefined") {
        if (tableValues[currSearchObjArrId].length == 0) {
            $('tbody').append("<tr id='placeholderLine'><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>");
        } else {
            var id = 1;
            $.each(tableValues[currSearchObjArrId], function (ind, item) {
                $('tbody').prepend("<tr id='" + item.id + "'><td>" + id + "</td><td>" + (item.title).substr(0, 30) + "..." + "</td> <td>" + item.listingType + "</td> <td>" + item.price + "</td> <td>" + item.condition + "</td> <td>" + item.country + "</td> <td>" + item.location + "</td> <td>" + item.shipsTo + "</td> <td>" + item.shippingPrice + "</td> <td>" + item.startTime + "</td></tr > ");
                $('#placeHolderLine').hide();
                id++;
            });

            // reselect the active item
            if (typeof selectedItemRemember[currSearchObjArrId] != "undefined") {
                $('tr.active').removeClass("active");
                changeListingView(tableValues[currSearchObjArrId][selectedItemRemember[currSearchObjArrId]]);
                $('#' + selectedItemRemember[currSearchObjArrId]).addClass("active");
            }
        }
    } else {
        $('tbody').append("<tr id='placeholderLine'><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>");
    }
}

// Whether the search object is searching or not
function changeStartButton() {
    activeSearches = $.unique(activeSearches);      // remove any duplicate items if there are any -- PRECAUTION
    if ($.inArray(currSearchObjArrId, activeSearches) == -1) {
        $('#btn_StartSearch').text("Start Search");
    } else {
        $('#btn_StartSearch').text("Stop Search");
    }
}

// Remove null keys (not deep, just top level)
function isNotNull(value) {
    return value != null;
}

// Delete Search Object
$('#btn_DeleteSearch').click(function () {
    swal({
        title: "Are you sure?",
        text: "You cannot undo this!",
        icon: "error",
        buttons: true,
        dangerMode: true
    }).then(function (choice) {
        if (choice) {
            if (currSearchObjArrId == -1) {
                activeSearches.splice($.inArray(currSearchObjArrId, activeSearches), 1);
                $('.header[data-id="' + currSearchObjArrId + '"]').remove();
                $.each(searchObjects, function (ind, val) {
                    if (val.Id == currSearchObjArrId) {
                        delete searchObjects[ind];
                        return;
                    }
                });
                searchObjects = searchObjects.filter(isNotNull);
                if (searchObjects.length) {
                    $('.header[data-id="' + searchObjects[0].Id + '"]').addClass("active");
                    changeSearchObject(searchObjects[0].Id);
                }
                shouldDisableConfig();
                filtersChanged = false;
            } else {
                $.ajax({
                    url: "../api/searches/" + currSearchObjArrId,
                    method: "DELETE",
                    beforeSend: function (request) {
                        request.setRequestHeader("Authorization", Cookies.get("token"));
                    },
                    success: function (data) {
                        // Delete the search object on page
                        activeSearches.splice($.inArray(currSearchObjArrId, activeSearches), 1);
                        $('.header[data-id="' + currSearchObjArrId + '"]').remove();
                        $.each(searchObjects, function (ind, val) {
                            if (val.Id == currSearchObjArrId) {
                                delete searchObjects[ind];
                                return;
                            }
                        });
                        searchObjects = searchObjects.filter(isNotNull);
                        if (searchObjects.length) {
                            $('.header[data-id="' + searchObjects[0].Id + '"]').addClass("active");
                            changeSearchObject(searchObjects[0].Id);
                        }
                        shouldDisableConfig();
                        filtersChanged = false;
                        activeSearches.splice($.inArray(currSearchObjArrId, activeSearches), 1);
                    },
                    error: function (data) {
                        swal("Oops...", "Error: " + data.status + ". " + data.responseJSON.Message + ". Try refreshing the page.", "error");
                    }
                });
            }
        }
    });
});

// Clear the results table
$('#btn_ClearSearch').click(function () {
    $('tbody').html('<tr><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr >');
    tableValues[currSearchObjArrId] = {};
});

// Work out which query to call next
function searchCallMath() {
    searchAPI(callQueue[0]);       // front of the queue
    var temp = callQueue[0];    // moves to the back of the queue
    callQueue.shift();
    callQueue.push(temp);
}

// Start the search
$('#btn_StartSearch').click(function () {
    if ($.inArray(currSearchObjArrId, activeSearches) == -1) {
        if (!filtersChanged) {
            activeSearches.push(currSearchObjArrId);
            createNotification("Search Started", "To stop searching click the \"Stop Search\" button.");
            searchAPI(currSearchObjArrId);      // call search on button click
            callQueue.push(currSearchObjArrId);     // push current query to back of the queue
            intervalArr[currSearchObjArrId] = setInterval(function () { // create new interval and add to the interval array
                searchCallMath();
            }, 60000);      // call once per minute
        } else {
            swal("Oops...", "You need to save your changes!", "error");
        }
    } else {
        // stopping search
        activeSearches.splice($.inArray(currSearchObjArrId, activeSearches), 1);        // remove from the active searches
        createNotification("Search Stopped", "You can continue searching by click the \"Start Search\" button.");
        var index = callQueue.indexOf(currSearchObjArrId);  // remove from call queue
        if (index !== -1) {
            callQueue.splice(index, 1);
        }
        clearInterval(intervalArr[currSearchObjArrId]); // delete the associated setInterval object
    }
    activeSearches = $.unique(activeSearches);
    changeStartButton();
});

function searchAPI(id) {
    // Search the Ebay API
    $.ajax({
        url: "../api/ebaysearch/" + id,
        method: "GET",
        beforeSend: function (request) {
            request.setRequestHeader("Authorization", Cookies.get("token"));
        },
        success: function (data) {
            // remove newBatch class from previous fetched results
            $('.newBatch').each(function () {
                $(this).removeClass("newBatch");
            });

            // if table results for current search object dont exist, create it
            if (!tableValues[id]) {
                tableValues[id] = {};
            }

            var newJSON = JSON.parse(data);     // convert to JSON object
            if (parseInt(newJSON.findItemsByKeywordsResponse[0].searchResult[0]["@count"]) > 0) {
                // If objects were found, create a temp item object with properties found in the result.
                var items = newJSON.findItemsByKeywordsResponse[0].searchResult[0].item;
                var timestampIdArr = {};
                var parsedItems = {};
                for (var i = 0; i < items.length; i++) {
                    // Allow only if currently active and on the GB Ebay site
                    if (items[i].sellingStatus[0].sellingState[0] == "Active" && items[i].globalId[0] == "EBAY-GB") {
                        // CREATE OBJECT
                        var item = {};
                        item.condition = items[i].condition[0].conditionDisplayName[0];
                        item.country = items[i].country[0];
                        item.id = items[i].itemId[0];
                        item.location = items[i].location[0];
                        item.title = items[i].title[0];
                        item.URL = items[i].viewItemURL[0];
                        item.listingType = items[i].listingInfo[0].listingType[0];
                        var timestamp = Date.parse(items[i].listingInfo[0].startTime[0]);
                        timestampIdArr[item.id] = timestamp;
                        var dateConstruct = new Date(timestamp);
                        item.startTime = dateConstruct.toLocaleString("en-GB");
                        timestamp = Date.parse(items[i].listingInfo[0].endTime[0]);
                        dateConstruct = new Date(timestamp);
                        item.endTime = dateConstruct.toLocaleString("en-GB");
                        item.price = "£" + parseFloat(items[i].sellingStatus["0"].currentPrice["0"].__value__).toFixed(2);
                        item.shipsTo = items[i].shippingInfo[0].shipToLocations[0];
                        item.shippingType = items[i].shippingInfo[0].shippingType[0];
                        if (item.shippingType != "Free") {
                            item.shippingPrice = "£" + parseFloat(items[i].shippingInfo[0].shippingServiceCost[0].__value__).toFixed(2);
                        } else {
                            item.shippingPrice = "£0.00";
                        }
                        if (item.listingType == "Auction" || item.listingType == "AuctionWithBIN") {
                            item.bidCount = items[i].sellingStatus[0].bidCount[0];
                        }
                        if (!tableValues[item.id]) {
                            parsedItems[item.id] = item;
                        }
                    }
                }
                if (Object.keys(timestampIdArr).length > 0) {
                    // If new objects are found, sort them via start time and then add them to the table
                    var sortedParsedItems = {};
                    var i = 0;
                    // sort the list by time
                    sortArray(timestampIdArr, function (key, value) {
                        sortedParsedItems[i] = parsedItems[key];
                        i++;
                    });
                    var newItem = false;

                    // add to table if on correct search object
                    $.each(sortedParsedItems, function (key, item) {
                        // add to tableValues if a new value
                        if (typeof tableValues[currSearchObjArrId][item.id] == "undefined") {
                            tableValues[id][item.id] = item;
                            newItem = true;
                            // if not in the table, add it and show on the table
                            if (parseInt(currSearchObjArrId) == parseInt(id)) {
                                // Add to overall table                            
                                $('tbody').prepend("<tr id='" + item.id + "' class='newBatch'><td>" + Object.keys(tableValues[id]).length + "</td><td>" + (item.title).substr(0, 30) + "..." + "</td> <td>" + item.listingType + "</td> <td>" + item.price + "</td> <td>" + item.condition + "</td> <td>" + item.country + "</td> <td>" + item.location + "</td> <td>" + item.shipsTo + "</td> <td>" + item.shippingPrice + "</td> <td>" + item.startTime + "</td></tr > ");
                                $('#placeHolderLine').hide();
                            }
                        }
                    });
                    createNotification("New Listings Found", "New listing(s) for the " + $('.header[data-id="' + currSearchObjArrId + '"]').text() + " Search Query have been found.");
                }
            }
        },
        error: function (data) {
            if (data.responseJSON.Message == "You must wait 1 minute per request per search object.") {
                console.log(data.status + ": You must wait 1 minute per request per search object.");
            } else {
                swal("Oops...", "Error: " + data.status + ". " + data.responseJSON.Message + ". Try refreshing the page.", "error");
            }           
        }
    });
}

// On click of table row
$('table').on("click", "tr", function () {
    if ($(this).parent().prop("id") == "tableBody" && $(this).prop("id") != "placeholderLine") {
        $(this).removeClass("newBatch");        // remove the "new item" look of row
        if ($(this).prop("id") != currSelectedItem) {       // only continue if not already chosen
            var objectToBeSelected = tableValues[currSearchObjArrId][$(this).prop("id")];
            changeListingView(objectToBeSelected);
        }
        currSelectedItem = $(this).prop("id");
        $(this).addClass("active");
    }
});

// update visually the item
function updateItem(d) {
    // URL
    $('#url').prop("href", d.URL);

    // TITLE
    $('#title').html(d.Title);

    // SELLER NAME
    $('#sellerName').html(d.Seller.UserID);

    // SELLER SCORE
    $('#sellerScore').html(d.Seller.PositiveFeedbackPercent + "% positive (" + d.Seller.FeedbackScore + " ratings)");

    // ITEM PRICE
    $('#price').html(d.Price);

    // LOCATION
    $('#shipsFrom').html(d.Location + ", " + d.Country);

    // LISTING TYPE
    $('#listingType').html(d.ListingType);

    // ID
    $('#ID').html(d.ItemID);

    // SHIPPING COST
    $('#shippingCost').html(d.ShippingCost);

    // RETURNS
    if (d.ReturnPolicy.ReturnsAccepted == "Returns Accepted") {
        $('#returns').html("Returns Accepted");
    } else {
        $('#returns').html("No Returns");
    }

    // CONDITION
    $('#condition').html(d.ConditionDisplayName);

    // DESCRIPTION
    if (d.Description) {
        $('#description').html(d.Description);
    } else if (d.Subtitle) {
        $('#description').html(d.Subtitle);
    } else {
        $('#description').html("<span style='color: red;'>NO DESCRIPTION</span>");
    }

    // ITEM SPECIFICS
    $('#itemSpecifics').html("");
    if (d.ItemSpecifics) {
        $.each(d.ItemSpecifics.NameValueList, function (key, val) {
            $('#itemSpecifics').append("<li><b>" + val.Name + "</b> " + val.Value + "</li>");
        });
    } else {
        $('#itemSpecifics').html("<h2 style='color: red;'><b>No Item Specifics</b></h2>");
    }

    // IMAGES
    var imageCount = 0;
    $('#images').html('<div class="row imgRow"></div>');
    if (d.PictureURL) {
        $.each(d.PictureURL, function (ind, val) {
            imageCount++;
            if (imageCount % 4 == 0) {
                $('.imgRow').last().append('<div class="col-sm-3"><img src="' + val + '" style= "width: 100%;" /></div>');
                $('#images').append('<div class="row imgRow"></div>');
            } else {
                $('.imgRow').last().append('<div class="col-sm-3"><img src="' + val + '" style= "width: 100%;" /></div>');
            }
        });
    } else {
        $('#images').html("<h2><b>No Images<b></h2>");
    }

    $('#loadingListing').hide();
    $('#listingContainer').show();
}

// Change Listing View
function changeListingView(obj) {
    selectedItemRemember[currSearchObjArrId] = obj.id;
    $('tr.active').removeClass("active");
    $('#loadingListing').show();
    $('#listingContainer').hide();
    var itemId = obj.id;
    // checks if the detail has already been downloaded or not
    if (typeof itemDetail[itemId] != "undefined") {
        updateItem(itemDetail[itemId]);
    } else {
        $.ajax({
            url: "../api/itemsearch/" + itemId,
            method: "GET",
            beforeSend: function (request) {
                request.setRequestHeader("Authorization", Cookies.get("token"));
            },
            success: function (data) {
                data = JSON.parse(data);
                data.Item.ShippingCost = obj.shippingPrice;
                data.Item.Price = obj.price;
                data.Item.URL = obj.URL;
                itemDetail[data.Item.ItemID] = data.Item;       // adds detail to the JSON. prevents multiple requests for the same thing
                var d = data.Item;
                updateItem(d);
                $('#resultsTableContainer').css("height", ($('#listingContainer').innerHeight()) + "px");
            },
            error: function (data) {
                swal("Oops...", "Error: " + data.status + ". " + data.responseJSON.Message + ". Try refreshing the page.", "error");
            }
        });
    }
}

// Sort associative array by values
function sortArray(obj, callback, context) {
    var tuples = [];
    for (var key in obj) tuples.push([key, obj[key]]);

    tuples.sort(function (a, b) {
        return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0
    });

    var length = tuples.length;
    while (length--) callback.call(context, tuples[length][0], tuples[length][1]);
}

// Create a notification
function createNotification(title, message) {
    var options = {
        body: message,
        icon: "/Content/img/InstabuyLogo.png"
    };
    var n = new Notification(title, options);
    setTimeout(n.close.bind(n), 5000);
}