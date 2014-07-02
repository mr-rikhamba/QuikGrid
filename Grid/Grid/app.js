function Viewmodel() {
    var self = this;

    self.users = ko.observableArray([
        {
            name: "Tiyiselani",
            age: "24",
            dob: '1990'
        },
        {
            name: "Andrew",
            age: "35",
            dob: '1977'
        },
        {
            name: "Naruto",
            age: "29",
            dob: '1985'
        },
        {
            name: "Ichigo",
            age: "22",
            dob: '1992'
        },
        {
            name: "Minato",
            age: "5",
            dob: '2008'
        },
        {
            name: "Renji",
            age: "9",
            dob: '2004'
        }]);
    self.selectedItems = ko.observableArray();
    self.selectedItem = ko.observable();
    self.thisGrid = {
        data: ko.mapping.fromJS(self.users),
        filter: true,
        multiselect: true,
        selectedItems: self.selectedItems,
        selectedItem: self.selectedItem,
        paging: { dataUrl: 'caps/api/randomctrl/?' },
        columns: [
            {
                field: "name",
                header: "Name",
                show: true
            }, {
                field: "age",
                header: "Age",
            }, {
                field: "dob",
                header: "DateOfBirth"
            }
        ]
    };
    self.selectedItems.subscribe(function() {
        $('#sel').html(ko.toJSON(self.selectedItems));
    });
    self.Save = function() {
        alert(ko.toJSON(self.selectedItems));
    };


}

ko.applyBindings(new Viewmodel());