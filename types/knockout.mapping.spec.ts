import "./knockout.mapping";
import * as ko from "knockout";

/*
 * Basic Usage
 */

interface SimpleObject {
    serverTime: string;
    numUsers: number;
}

const simpleData: SimpleObject = {
    serverTime: "2010-01-07",
    numUsers: 3
};

const simpleVM = ko.mapping.fromJS(simpleData);
simpleVM.serverTime("2010-01-08");
simpleVM.numUsers(5);

ko.mapping.fromJS(simpleData, simpleVM);

/*
 * Advanced Usage
 */

interface AdvancedData {
    name: string;
    children: AdvancedDataChild[];
}
interface AdvancedDataChild {
    id: number;
    name: string;
}

interface AdvancedVM extends ko.mapping.MappedObservable<AdvancedData> {
}

const advancedData: AdvancedData = {
    name: "Scott",
    children: [
        { id: 1, name: "Alice" }
    ]
};

const advancedVM = ko.mapping.fromJS(advancedData);
advancedVM.name("test");
advancedVM.children()[0].id(2);

const advancedMapping: ko.mapping.MappingOptions<AdvancedData> = {
    children: {
        key(data) {
            return ko.unwrap(data.id);
        }
    }
};

const advancedVM2 = ko.mapping.fromJS<AdvancedVM>(advancedData, advancedMapping);
advancedVM2.name("test");
advancedVM2.children()[0].id(2);

class AdvancedVMChild {
    id: ko.Observable<number>;
    name: ko.Observable<string>;

    constructor(data: AdvancedDataChild) {
        this.id = ko.observable(data.id);
        this.name = ko.observable(data.name);
    }
}

interface AdvancedVMWithChildren {
    name: ko.Observable<string>;
    children: ko.ObservableArray<AdvancedVMChild>;
}

const advancedMappingChildren: ko.mapping.MappingOptions<AdvancedData> = {
    children: {
        key(data) {
            return data.id;
        },
        create(opts) {
            return new AdvancedVMChild(opts.data);
        }
    }
};

const advancedVMChildren = ko.mapping.fromJS<AdvancedVMWithChildren>(advancedData, advancedMappingChildren);
advancedVMChildren.name("test");
advancedVMChildren.children()[0].id(5);

const advancedMappingUpdate: ko.mapping.MappingOptions<AdvancedData> = {
    name: {
        update(opts) {
            return opts.data + " updated!";
        }
    }
};

const advancedVMUpdate = ko.mapping.fromJS<AdvancedVM>(advancedData, advancedMappingUpdate);

const advancedMappingOptions: ko.mapping.MappingOptions<AdvancedData> = {
    ignore: ["name"],
    include: ["children"],
    copy: ["children"],
    observe: ["name"]
}

/*
 * Automatic Mapping
 */

const autoMapped = ko.mapping.fromJS(simpleData);
autoMapped.numUsers();
autoMapped.serverTime();

const autoMappedWithOptions = ko.mapping.fromJS(simpleData, {});
autoMappedWithOptions.numUsers();
autoMappedWithOptions.serverTime();

const simpleDataArray = [simpleData];
const autoMappedArray = ko.mapping.fromJS(simpleDataArray);
autoMappedArray()[0].numUsers();
autoMappedArray()[0].serverTime();

const autoMappedArrayWithOptions = ko.mapping.fromJS(simpleDataArray, {});
autoMappedArrayWithOptions()[0].numUsers();
autoMappedArrayWithOptions()[0].serverTime();
