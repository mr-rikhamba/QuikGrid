ko.bindingHandlers.quikgrid = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, context) {

        var value = valueAccessor();

        // Next, whether or not the supplied model property is observable, get its current value
        var valueUnwrapped = ko.unwrap(value);

        //Add isSelected proprty to your data
        ko.utils.arrayForEach(valueUnwrapped.data(), function(item) {
            item.isSelected = ko.observable();
        });

        
        var table = document.createElement("table");

        var thead = table.createTHead();
        var row = document.createElement("tr");
        thead.appendChild(row);
        row.innerHTML = "<th class='tblHeader' data-bind='visible: show, text: header'></th>";

        var tbody = table.createTBody();
        //var bodyRow = document.createElement("tr");
        

        var bodyRow = $('<tr data-bind="attr: {\'aria-selected\':isSelected}"><tr>')[0];
        tbody.appendChild(bodyRow);
        var str = "";
        var strVisibility = "";
        var cols = [];

        var responsiveColumnsText = '';
        for (var i = 0; i < valueUnwrapped.columns.length; i++) {
            valueUnwrapped.columns[i].show = valueUnwrapped.columns[i].show == undefined ? ko.observable(true) : ko.observable(false);
            str += "<td data-bind='visible: ko.observable(" + valueUnwrapped.columns[i].show() + "), text: " + valueUnwrapped.columns[i].field + "'>";


            strVisibility += '<div class="colsShow">' +
                '<label data-bind="text: header"></label>' +
                '<input data-bind="checked: show" type="checkbox" /></div>';

            var i2 = i + 1;
            responsiveColumnsText += 'td:nth-of-type(' + i2 + '):before {content: "' + valueUnwrapped.columns[i].header + '";}';
        }
        var t = '@media only screen and (max-width: 760px), (min-device-width: 768px) and (max-device-width: 1024px) {' +
            responsiveColumnsText +
            '}';
        $('<style>' + t +
            '</style>')
            .appendTo('head');
        var columnsVisibility = $(strVisibility)[0];
        element.appendChild(columnsVisibility);
        ko.applyBindingsToNode(columnsVisibility, {
            foreach: valueUnwrapped.columns
        });

        bodyRow.innerHTML = str;


        /////////////////Filter
        valueUnwrapped.filter = undefined ? true : valueUnwrapped.filter;
        if (valueUnwrapped.filter != false) {
            valueUnwrapped.filterText = ko.observable('');
            ko.computed(function(parameters) {

                GetData("/api/filter", valueUnwrapped.data);

            }).extend({ throttle: 1000 });
            var searchInput = $('<input data-bind="value: filterText, valueUpdate: \'afterkeydown\'" class="tblText" type="text" placeholder="Search for records"/>')[0];
            element.appendChild(searchInput);
            ko.applyBindingsToNode(searchInput, {
                value: valueUnwrapped.filterText
            });
        }
        $(element).addClass('quikgrid');
        element.appendChild(table);
        ko.applyBindingsToNode(row, {
            foreach: valueUnwrapped.columns,
            click: function(a, b) {
                var item = ko.contextFor(b.target).$data;
                console.log('clicked header ' + item.field);
                var response = sortByKey(ko.mapping.toJS(a), item.field);
                console.log(ko.toJSON(response));
                valueUnwrapped.data(ko.mapping.fromJS(response)());
                valueUnwrapped.data.valueHasMutated();
            }
        }, valueUnwrapped.data);



        /////////Bind tbody
        var lastSelectedItem;
        ko.applyBindingsToNode(tbody, {
            foreach: valueUnwrapped.data,

            event: {
                click: function(a, b) {
                    if (b.ctrlKey == true && valueUnwrapped.multiselect == true) {
                        var item = ko.contextFor(b.target).$data;

                        if (!item.isSelected()) {
                            item.isSelected(true);
                            valueUnwrapped.selectedItems.remove(item);
                            valueUnwrapped.selectedItems.push(item);
                        } else {
                            item.isSelected(false);
                            valueUnwrapped.selectedItems.remove(item);
                        }
                    }
                },
                dblclick: function(a, b, c) {
                    var item = ko.contextFor(b.target).$data;

                    if (lastSelectedItem != undefined) {
                        lastSelectedItem.isSelected(false);
                    }
                    ko.utils.arrayForEach(valueUnwrapped.data(), function(citem) {
                        citem.isSelected(false);
                    });

                    lastSelectedItem = item;
                    valueUnwrapped.selectedItem(lastSelectedItem);
                    var selected = lastSelectedItem.isSelected() == true ? false : true;
                    lastSelectedItem.isSelected(selected);

                    valueUnwrapped.selectedItems.removeAll();
                    if (!selected) {
                        valueUnwrapped.selectedItems.remove(lastSelectedItem);
                    } else {
                        valueUnwrapped.selectedItems.push(lastSelectedItem);
                    }
                }
            },
            touchstart: function(a, b, c) {
                alert('long press');
            }
        }, bodyRow);

        ////////////////////////Paging Start
        if (valueUnwrapped.paging != undefined) {
            valueUnwrapped.paging.pageNumber = ko.observable(0);
            valueUnwrapped.paging.pageSize = ko.observable(0);
            valueUnwrapped.paging.pageUp = function(a, b, c) {
                var current = a.pageNumber();
                a.pageNumber(current + 1);
            };

            valueUnwrapped.paging.pageDown = function(a, b, c) {
                var current = a.pageNumber();
                if (current > 0) {
                    a.pageNumber(current - 1);
                }
            };

            ko.computed(function(parameters) {
               GetData(valueUnwrapped.paging.dataUrl + 'pageNumber=' + valueUnwrapped.paging.pageNumber() + '&pageSize=' + valueUnwrapped.paging.pageSize(), valueUnwrapped.data);
                console.log('paging');
            }).extend({ throttle: 1000 });

            var paging = $('<div data-bind="with: paging">' +
                '<div class="pgControls"><label>Page Size:</label><br/><input data-bind="value: pageNumber, valueUpdate: \'afterkeydown\'" type="text" placeholder="Page Number"/></div>' +
                '<div class="pgControls"><label>Page Number:</label><br/><input data-bind="value: pageSize, valueUpdate: \'afterkeydown\'" type="text" placeholder="Results Per Page"/></div>' +
                '<input data-bind="click: pageDown" type="button" value="<<<"/>' +
                '<input data-bind="click: pageUp" type="button" value=">>>"/>' +
                '</div>')[0];
            element.appendChild(paging);
            ko.applyBindingsToNode(paging, {
                with: valueUnwrapped.paging
            });
        ///////////////Paging End
        }
        
        return { controlsDescendantBindings: true };
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called once when the binding is first applied to an element,
        // and again whenever the associated observable changes value.
        // Update the DOM element based on the supplied values here.


    },
    options: {
        searchValue: ko.observable
    }
};


function propName(prop, value) {
    for (var i in prop) {
        if (prop[i] == value) {
            return i;
        }
    }
    return false;
}

function sortByKey(arr, key) {
    var reA = /[^a-zA-Z]/g;
    var reN = /[^0-9]/g;
    var originalArray = [arr];
    var sortedArray = arr.sort(function(a, b) {
        a = a[key];
        b = b[key];
        var aA = a.replace(reA, "");
        var bA = b.replace(reA, "");
        if (aA === bA) {
            var aN = parseInt(a.replace(reN, ""), 10);
            var bN = parseInt(b.replace(reN, ""), 10);
            return aN === bN ? 0 : aN > bN ? 1 : -1;
        } else {
            return aA > bA ? 1 : -1;
        }
    });
    //if (originalArray[0][0][key] == sortedArray[0][key]) {
    //    return sortedArray.reverse();
    //}
    return sortedArray;
}

function GetData(apiUrl, targetVm, callback) {


    //blockUi();
    var getUrl = 'http://' + location.host.toString();
    $.ajax({
        cache: self.cacheRequest,
        url: getUrl += apiUrl,
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        success: function(returnData) {
            if (targetVm != null) {
                targetVm.remove(function(item) { return true; });
                ko.mapping.fromJS(returnData, { }, targetVm);

            } else {
                self.model.remove(function(item) { return true; });
                ko.mapping.fromJS(returnData, { }, self.model);

            }


        },
        error: function(e) {

        },
        complete: function(s) {
            if (callback != undefined) {
                callback(s);
            }

        }
    });
}