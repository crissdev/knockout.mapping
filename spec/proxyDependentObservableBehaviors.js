(function() {
    'use strict';
    /*global ko, QUnit*/

    function generateProxyTests(useComputed) {
        var moduleName = useComputed ? 'ProxyComputed' : 'ProxyDependentObservable';
        var testInfo;

        QUnit.module(moduleName, {
            beforeEach: function() {
                ko.mapping.resetDefaultOptions();
                createTestInfo();
            }
        });

        function createComputed() {
            var result;
            result = useComputed ? ko.computed.apply(null, arguments) : ko.dependentObservable.apply(null, arguments);
            return result;
        }

        function createTestInfo() {
            testInfo = {
                evaluationCount: 0,
                writeEvaluationCount: 0
            };
            testInfo.create = function(createOptions) {
                var obj = {
                    a: "b"
                };

                var mapping = {
                    a: {
                        create: function(options) {
                            createOptions = createOptions || {};
                            var mapped = ko.mapping.fromJS(options.data, mapping);

                            var doData = function() {
                                testInfo.evaluationCount++;
                                return "test";
                            };
                            if (createOptions.useReadCallback) {
                                mapped.DO = createComputed({
                                    read: doData,
                                    deferEvaluation: !!createOptions.deferEvaluation
                                }, mapped);
                            }
                            else if (createOptions.useWriteCallback) {
                                mapped.DO = createComputed({
                                    read: doData,
                                    write: function(value) {
                                        testInfo.written = value;
                                        testInfo.writeEvaluationCount++;
                                    },
                                    deferEvaluation: !!createOptions.deferEvaluation
                                }, mapped);
                            }
                            else {
                                mapped.DO = createComputed(doData, mapped, {
                                    deferEvaluation: !!createOptions.deferEvaluation
                                });
                            }

                            return mapped;
                        }
                    }
                };

                return ko.mapping.fromJS(obj, mapping);
            };
        }

        QUnit.test('ko.mapping.fromJS should handle interdependent dependent observables in objects', function(assert) {
            var obj = {
                a: {a1: "a1"},
                b: {b1: "b1"}
            };

            var dependencyInvocations = [];

            var result = ko.mapping.fromJS(obj, {
                a: {
                    create: function(options) {
                        return {
                            a1: ko.observable(options.data.a1),
                            observeB: createComputed(function() {
                                dependencyInvocations.push("a");
                                return options.parent.b.b1();
                            })
                        };
                    }
                },
                b: {
                    create: function(options) {
                        return {
                            b1: ko.observable(options.data.b1),
                            observeA: createComputed(function() {
                                dependencyInvocations.push("b");
                                return options.parent.a.a1();
                            })
                        };
                    }
                }
            });

            assert.equal("b1", result.a.observeB());
            assert.equal("a1", result.b.observeA());
        });

        QUnit.test('ko.mapping.fromJS should handle interdependent dependent observables with read/write callbacks in objects', function(assert) {
            var obj = {
                a: {a1: "a1"},
                b: {b1: "b1"}
            };

            var dependencyInvocations = [];

            var result = ko.mapping.fromJS(obj, {
                a: {
                    create: function(options) {
                        return {
                            a1: ko.observable(options.data.a1),
                            observeB: createComputed({
                                read: function() {
                                    dependencyInvocations.push("a");
                                    return options.parent.b.b1();
                                },
                                write: function(value) {
                                    options.parent.b.b1(value);
                                }
                            })
                        };
                    }
                },
                b: {
                    create: function(options) {
                        return {
                            b1: ko.observable(options.data.b1),
                            observeA: createComputed({
                                read: function() {
                                    dependencyInvocations.push("b");
                                    return options.parent.a.a1();
                                },
                                write: function(value) {
                                    options.parent.a.a1(value);
                                }
                            })
                        };
                    }
                }
            });

            assert.equal(result.a.observeB(), "b1");
            assert.equal(result.b.observeA(), "a1");

            result.a.observeB("b2");
            result.b.observeA("a2");
            assert.equal(result.a.observeB(), "b2");
            assert.equal(result.b.observeA(), "a2");
        });

        QUnit.test('ko.mapping.fromJS should handle dependent observables in arrays', function(assert) {
            var obj = {
                items: [
                    {id: "a"},
                    {id: "b"}
                ]
            };

            var dependencyInvocations = 0;

            var result = ko.mapping.fromJS(obj, {
                "items": {
                    create: function(options) {
                        return {
                            id: ko.observable(options.data.id),
                            observeParent: createComputed(function() {
                                dependencyInvocations++;
                                return options.parent.items().length;
                            })
                        };
                    }
                }
            });

            assert.equal(result.items()[0].observeParent(), 2);
            assert.equal(result.items()[1].observeParent(), 2);
        });

        QUnit.test('dependentObservables with a write callback are passed through', function(assert) {
            var mapped = testInfo.create({useWriteCallback: true});

            mapped.a.DO("hello");
            assert.equal(testInfo.written, "hello");
            assert.equal(testInfo.writeEvaluationCount, 1);
        });

        QUnit.test('throttleEvaluation is correctly applied', function(assert) {
            var done = assert.async();
            assert.expect(1);

            var obj = {
                a: "hello"
            };

            var dependency = ko.observable(0);
            var mapped = ko.mapping.fromJS(obj, {
                a: {
                    create: function() {
                        var f = createComputed(function() {
                            dependency(dependency() + 1);
                            return dependency();
                        });
                        var ex = f.extend({throttle: 1});
                        return ex;
                    }
                }
            });

            // Even though the dependency updates many times, it should be throttled to only one update
            dependency.valueHasMutated();
            dependency.valueHasMutated();
            dependency.valueHasMutated();
            dependency.valueHasMutated();

            window.setTimeout(function() {
                assert.equal(mapped.a(), 1);
                done();
            }, 1);
        });

        QUnit.test('dependentObservables without a write callback do not get a write callback', function(assert) {
            var mapped = testInfo.create({useWriteCallback: false});
            var fn = function() {
                mapped.a.DO("hello");
            };
            assert.throws(fn);
        });

        QUnit.test('un-deferred dependentObservables that are NOT used immediately SHOULD be auto-evaluated after mapping', function(assert) {
            var done = assert.async();
            assert.expect(1);

            var mapped = testInfo.create();
            window.setTimeout(function() {
                assert.equal(testInfo.evaluationCount, 1);
                done();
            }, 0);
        });

        QUnit.test('un-deferred dependentObservables that ARE used immediately should NOT be auto-evaluated after mapping', function(assert) {
            var done = assert.async();
            assert.expect(2);

            var mapped = testInfo.create();
            assert.equal(ko.utils.unwrapObservable(mapped.a.DO), "test");
            window.setTimeout(function() {
                assert.equal(testInfo.evaluationCount, 1);
                done();
            }, 0);
        });

        QUnit.test('deferred dependentObservables should NOT be auto-evaluated after mapping', function(assert) {
            var done = assert.async();
            assert.expect(1);

            var mapped = testInfo.create({deferEvaluation: true});
            window.setTimeout(function() {
                assert.equal(testInfo.evaluationCount, 0);
                done();
            }, 0);
        });

        QUnit.test('un-deferred dependentObservables with read callback that are NOT used immediately SHOULD be auto-evaluated after mapping', function(assert) {
            var done = assert.async();
            assert.expect(1);

            var mapped = testInfo.create({useReadCallback: true});
            window.setTimeout(function() {
                assert.equal(testInfo.evaluationCount, 1);
                done();
            }, 0);
        });

        QUnit.test('un-deferred dependentObservables with read callback that ARE used immediately should NOT be auto-evaluated after mapping', function(assert) {
            var done = assert.async();
            assert.expect(2);

            var mapped = testInfo.create({useReadCallback: true});
            assert.equal(ko.utils.unwrapObservable(mapped.a.DO), "test");
            window.setTimeout(function() {
                assert.equal(testInfo.evaluationCount, 1);
                done();
            }, 0);
        });

        QUnit.test('deferred dependentObservables with read callback should NOT be auto-evaluated after mapping', function(assert) {
            var done = assert.async();
            assert.expect(1);

            var mapped = testInfo.create({deferEvaluation: true, useReadCallback: true});
            window.setTimeout(function() {
                assert.equal(testInfo.evaluationCount, 0);
                done();
            }, 0);
        });

        QUnit.test('can subscribe to proxy dependentObservable', function(assert) {
            assert.expect(0);
            var mapped = testInfo.create({deferEvaluation: true, useReadCallback: true});
            var subscriptionTriggered = false;
            mapped.a.DO.subscribe(function() {
            });
        });

        QUnit.test('can subscribe to nested proxy dependentObservable', function(assert) {
            var obj = {
                a: {b: null}
            };

            var DOsubscribedVal;
            var mapping = {
                a: {
                    create: function(options) {
                        var mappedB = ko.mapping.fromJS(options.data, {
                            create: function(options) {
                                //In KO writable computed observables have to be backed by an observable
                                //otherwise they won't be notified they need updating. see: http://jsfiddle.net/drdamour/9Pz4m/
                                var _DOval = ko.observable(undefined);

                                var m = {};
                                m.myValue = ko.observable("myValue");
                                m.DO = createComputed({
                                    read: function() {
                                        return _DOval();
                                    },
                                    write: function(val) {
                                        _DOval(val);
                                    }
                                });
                                m.readOnlyDO = createComputed(function() {
                                    return m.myValue();
                                });
                                return m;
                            }
                        });
                        mappedB.DO.subscribe(function(val) {
                            DOsubscribedVal = val;
                        });
                        return mappedB;
                    }
                }
            };

            var mapped = ko.mapping.fromJS(obj, mapping);
            mapped.a.DO("bob");
            assert.equal(ko.utils.unwrapObservable(mapped.a.readOnlyDO), "myValue");
            assert.equal(ko.utils.unwrapObservable(mapped.a.DO), "bob");
            assert.equal(DOsubscribedVal, "bob");
        });

        QUnit.skip('dependentObservable dependencies trigger subscribers', function(assert) {
            var obj = {
                inner: {
                    dependency: 1
                }
            };

            var Inner = function(data) {
                var _this = this;
                ko.mapping.fromJS(data, {}, _this);

                _this.DO = createComputed(function() {
                    return _this.dependency();
                });

                _this.evaluationCount = 0;
                _this.DO.subscribe(function() {
                    _this.evaluationCount++;
                });
            };

            var mapping = {
                inner: {
                    create: function(options) {
                        return new Inner(options.data);
                    }
                }
            };

            var mapped = ko.mapping.fromJS(obj, mapping);
            var i = mapped.inner;
            assert.equal(i.evaluationCount, 1); //it's evaluated once prior to fromJS returning

            // change the dependency
            i.dependency(2);

            // should also have re-evaluated
            assert.equal(i.evaluationCount, 2);
        });

        //taken from outline defined at https://github.com/SteveSanderson/knockout.mapping/issues/95#issuecomment-12275070
        QUnit.test('dependentObservable evaluation is deferred until mapping takes place', function(assert) {
            var model = {
                a: {name: "a"},
                b: {name: "b"}
            };

            var MyClassA = function(data, parent) {
                var _this = this;

                ko.mapping.fromJS(data, {}, _this);

                _this.DO = createComputed(function() {
                    //Depends on b, which may not be there yet
                    return _this.name() + parent.b.name();
                });
            };

            var MyClassB = function(data, parent) {
                var _this = this;

                ko.mapping.fromJS(data, {}, _this);

                _this.DO = createComputed(function() {
                    //depends on a, which may not be there yet
                    return _this.name() + parent.a.name();
                });
            };


            var mapping = {
                a: {
                    create: function(options) {
                        return new MyClassA(options.data, options.parent);
                    }
                },
                b: {
                    create: function(options) {
                        return new MyClassB(options.data, options.parent);
                    }
                }
            };

            var mappedVM = ko.mapping.fromJS(model, mapping);

            assert.equal(mappedVM.a.DO(), "ab");
            assert.equal(mappedVM.b.DO(), "ba");
        });

        QUnit.skip('dependentObservable mappingNesting is reset after exception', function(assert) {
            var model = {
                a: {name: "a"}
            };

            //First we throw a custom exception in the nested create and make sure it does throw
            function CustomError(message) {
                this.message = message;
            }

            CustomError.prototype.toString = function() {
                return this.message;
            };

            assert.throws(
                function() {
                    ko.mapping.fromJS(model, {
                        create: function() {
                            throw new CustomError("Create Threw");
                        }
                    });
                },
                CustomError,
                "fromJS throws correct 'CustomError' error type");

            //Second make sure mappingNesting was reset.
            //if mappingNesting wasn't reset the DO wouldn't have been evaluated before fromJS returning
            var obj = {
                inner: {
                    dependency: 1
                }
            };

            var Inner = function(data) {
                var _this = this;
                ko.mapping.fromJS(data, {}, _this);

                _this.DO = createComputed(function() {
                    return _this.dependency();
                });

                _this.evaluationCount = 0;
                _this.DO.subscribe(function() {
                    _this.evaluationCount++;
                });
            };

            var mapping = {
                inner: {
                    create: function(options) {
                        return new Inner(options.data);
                    }
                }
            };

            var mapped = ko.mapping.fromJS(obj, mapping);
            var i = mapped.inner;
            assert.equal(i.evaluationCount, 1); //it's evaluated once prior to fromJS returning
        });

        QUnit.test('dependentObservable evaluation for nested is deferred until after mapping takes place', function(assert) {
            var model = {
                a: {
                    name: "a",
                    c: {name: "c"} //nested
                },
                b: {
                    name: "b"
                }
            };

            var MyClassA = function(data, parent) {
                var _this = this;

                var mapping = {
                    c: {
                        create: function(options) {
                            return new MyClassC(options.data, options.parent, parent); //last param parent here is C's grandparent
                        }
                    }
                };

                ko.mapping.fromJS(data, mapping, _this);

                _this.DO = createComputed(function() {
                    //Depends on b, which may not be there yet
                    return _this.name() + parent.b.name();
                });
            };

            var MyClassB = function(data, parent) {
                var _this = this;

                ko.mapping.fromJS(data, {}, _this);

                _this.DO = createComputed(function() {
                    //depends on a, which may not be there yet
                    return _this.name() + parent.a.name();
                });
            };

            var MyClassC = function(data, parent, grandparent) {
                var _this = this;

                ko.mapping.fromJS(data, {}, _this);

                _this.DO = createComputed(function() {
                    //depends on a, which may not be there yet
                    return _this.name() + parent.name() + grandparent.a.name() + grandparent.b.name();
                });
            };


            var mapping = {
                a: {
                    create: function(options) {
                        return new MyClassA(options.data, options.parent);
                    }
                },
                b: {
                    create: function(options) {
                        return new MyClassB(options.data, options.parent);
                    }
                },
                c: {
                    create: function(options) {
                        return new MyClassC(options.data, options.parent);
                    }

                }
            };

            var mappedVM = ko.mapping.fromJS(model, mapping);


            assert.equal(mappedVM.a.DO(), "ab");
            assert.equal(mappedVM.b.DO(), "ba");
            assert.equal(mappedVM.a.c.DO(), "caab");
        });

        QUnit.test('dependentObservable.fn extensions are not missing during mapping', function(assert) {
            var obj = {
                x: 1
            };

            var Model = function(data) {
                var _this = this;

                ko.mapping.fromJS(data, {}, _this);

                _this.DO = createComputed(_this.x);
            };

            var mapping = {
                create: function(options) {
                    return new Model(options.data);
                }
            };

            ko.dependentObservable.fn.myExtension = true;

            var mapped = ko.mapping.fromJS(obj, mapping);

            assert.equal(mapped.DO.myExtension, true);
        });

        QUnit.test('Dont wrap dependent observables if already marked as deferEvaluation', function(assert) {
            var obj = {
                x: 1
            };

            function Model(data) {
                var _this = this;

                ko.mapping.fromJS(data, {}, _this);

                _this.DO1 = createComputed(_this.x, null, {deferEvaluation: true});
                _this.DO2 = createComputed({read: _this.x, deferEvaluation: true});
                _this.DO3 = createComputed(_this.x);
            }

            var mapping = {
                create: function(options) {
                    return new Model(options.data);
                }
            };

            var mapped = ko.mapping.fromJS(obj, mapping);

            assert.equal(mapped.DO1._wrapper, undefined);
            assert.equal(mapped.DO2._wrapper, undefined);
            assert.equal(mapped.DO3._wrapper, true);
        });

        QUnit.test('ko.mapping.updateViewModel should allow for the avoidance of adding an item to its parent observableArray', function(assert) {
            var obj = {
                items: [
                    {id: "a"},
                    {id: "b"}
                ]
            };

            var dependencyInvocations = 0;

            var result = ko.mapping.fromJS(obj, {
                "items": {
                    create: function(options) {
                        if (options.data.id === "b") {
                            return options.data;
                        }
                        else {
                            return options.skip;
                        }
                    }
                }
            });

            assert.equal(result.items().length, 1);
            assert.equal(result.items()[0].id, "b");
        });

        //unit test for updating existing arrays (e.g. first item is retained, second item is skipped and the third item gets added)?
        QUnit.test('ko.mapping.updateViewModel skipping an item should retain all other items', function(assert) {
            var obj = {
                items: [
                    {id: "a"},
                    {id: "b"},
                    {id: "c"}
                ]
            };

            var dependencyInvocations = 0;

            var result = ko.mapping.fromJS(obj, {
                "items": {
                    create: function(options) {
                        if (options.data.id === "b") {
                            return options.skip;
                        }
                        else {
                            return options.data;
                        }
                    }
                }
            });


            assert.equal(result.items().length, 2);
            assert.equal(result.items()[0].id, "a");
            assert.equal(result.items()[1].id, "c");
        });
    }

    generateProxyTests(false);
    generateProxyTests(true);
})();
