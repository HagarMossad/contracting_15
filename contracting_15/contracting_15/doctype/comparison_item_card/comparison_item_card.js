// Copyright (c) 2024, hagermossad80@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on("Comparison Item Card", {
    onload:function(frm){
        frm.ignore_doctypes_on_cancel_all = ['Comparison'];
        frm.events.setup_quiries(frm)
        frm.events.get_filters(frm)
    },
    // refresh:function(frm){
    // },
	setup: function(frm) {
        frm.events.setup_quiries(frm)
	},
    refresh: function(frm) {
        frm.events.setup_quiries(frm)
        // frm.events.upload_download_data(frm)
        frm.events.setup_function(frm)
        frm.events.upload_data_file(frm , "services")
        frm.events.upload_data_file(frm , "items")
        frm.events.upload_data_file(frm , "cost")

        frm.events.export_data_file(frm , "items" )
        frm.events.export_data_file(frm , "services" )
        frm.events.export_data_file(frm , "cost" )
        
	},
    get_filters: function(frm){
        if(frm.doc.comparison){
            frappe.call({
			    method: "frappe.client.get",
			    args: {
				    doctype: "Comparison",
                    name:frm.doc.comparison,
			    },
			    callback: function(r) {
                    if(r.message){
                        console.log(r.message.item);
                        let item = r.message.item ; 
                        const clearanceValues = item.map(item => item.clearance_item);;
                        console.log(clearanceValues);
                        frm.set_query('item_code', () => {
                            return {
                                filters: {
                                    name: ["in" , clearanceValues]
                                }
                            }
                        })
                    }

                }
            })
        }      

    },
    export_data_file: function(frm , table_name) {
        frm.fields_dict[table_name].grid.add_custom_button(
            __("Export Excel"),
            function() {             
                frappe.call({
                    method: "contracting_15.contract_api.export_data_file",
                    args: {
                        doctype: frm.doc.doctype,
                        table: table_name,
                        self: frm.doc
                    },
                    callback: function(r) {                        
                        if (r.message) {
                            let file_url = r.message.file_url;                            
                            if (file_url) {
                                window.open(file_url);
                            } else {
                                console.error('No file_url found in the response');
                            }
                        } else {
                            console.error('No message in the response');
                        }
                    },
                    error: function(err) {
                        console.error('Error during frappe.call:', err);
                    }
                });
            }
        );
    },
    
    setup_function: function(frm) {
        console.log("Setup")
        if (frm.doc.docstatus == 1) {
            
            frm.add_custom_button(
              __("Update Price"),
              function () {
                //console.log("fom s order")
                frappe.call(
                    {
                        "method" :"update_sales_price" ,
                        "doc"    : frm.doc,
                        
                    }
                )
              
              },
              __("Update")
            );
        }
    },
    upload_data_file:function(frm , table_name){
		frm.fields_dict[table_name].grid.add_custom_button(
			__("Upload Xlxs Data"),
			function() {
				let d = new frappe.ui.Dialog({
					title: "Enter details",
					fields: [
					{
						label: "Excel File",
						fieldname: "first_name",
						fieldtype: "Attach",
					},
					],
					primary_action_label: "Submit",
					primary_action(values) {
					console.log(`values===>${JSON.stringify(values)}`);
					var f = values.first_name;
					frappe.call({
						method:"contracting_15.contract_api.get_data_from_template_file",
						args: {
						file_url: values.first_name
						// file: values.first_name,
						// colms:['item_code','qty',]
						},
						callback: function(r) {
						if (r.message) {
							console.log(r.message)
							frm.clear_table(table_name);
							frm.refresh_fields(table_name);
							r.message.forEach(object => {
							var row = frm.add_child(table_name);
							Object.entries(object).forEach(([key, value]) => {
								 console.log(`${key}: ${value}`);
								row[key] = value;
							});
							 });
							frm.refresh_fields(table_name);
						}
						},
					});
					d.hide();
					},
				});
				d.show();
			}).addClass("btn-success");
			frm.fields_dict["items"].grid.grid_buttons
			.find(".btn-custom")
			.removeClass("btn-default")
	},
    // upload_download_data:function(frm){
    //     //download_data
    //     frm.fields_dict["items"].grid.add_custom_button(
    //         __("Download Data"),
    //         function() {
    //           // console.log("frm.items");contracting/contracting/contract_api.py
    //           frappe.call({
    //             method: "contracting_13.contract_api.export_data_to_file_fields",
    //             args: {
    //               items: frm.doc.items,
    //               colms:['item','item_name','uom','qty','unit_price','total_amount']
    //             },
    //             callback: function(r) {
    //               if (r.message){
    //                 console.log(r.message)
    //                   let file = r.message.file 
    //                   let file_url = r.message.file_url 
    //                 //   window.open(file_url);
    //                   file_url = file_url.replace(/#/g, '%23');
    //                   window.open(file_url);
    //               }
    //             },
    //           });
      
    //         }
    //       ).addClass("btn-primary");
        
    //       frm.fields_dict["items"].grid.add_custom_button(
    //         __("Upload Data"),
    //         function() {
    //             let d = new frappe.ui.Dialog({
    //                 title: "Enter details",
    //                 fields: [
    //                   {
    //                     label: "Excel File",
    //                     fieldname: "first_name",
    //                     fieldtype: "Attach",
    //                   },
    //                 ],
    //                 primary_action_label: "Submit",
    //                 primary_action(values) {
    //                 //   console.log(`values===>${JSON.stringify(values)}`);
    //                   var f = values.first_name;
    //                   frappe.call({
    //                     method:"contracting_13.contract_api.upload_data_comaprsion_item_card",
    //                     args: {
    //                       file: values.first_name,
    //                       colms:['item','item_name','uom','qty','unit_price','total_amount']
    //                     },
    //                     callback: function(r) {
    //                       if (r.message) {
    //                         frm.clear_table("items");
    //                         frm.refresh_fields("items");
    //                         r.message.forEach((element) => {
    //                           var row = frm.add_child("items");
    //                           row.item = element.item;
    //                           row.item_name = element.item_name;
    //                           row.uom = element.uom;
    //                           row.qty = element.qty;
    //                           row.unit_price = element.unit_price;
    //                           row.total_amount = element.total_amount;
    //                         });
    //                         frm.refresh_fields("items");
    //                       }
    //                     },
    //                   });
    //                 //   d.hide();
    //                 },
    //               });
    //               d.show();
    //         }).addClass("btn-success");
    //         frm.fields_dict["items"].grid.grid_buttons
    //         .find(".btn-custom")
    //         .removeClass("btn-default")
    // },
    setup_quiries:function(frm){
        frm.set_query("item", "items", function () {
            return {
              filters: [
                ["is_stock_item", "=", 1],
              ],
            };
          });
          frm.set_query("item_code", "services", function () {
            return {
              filters: [
                ["is_stock_item", "=", 0],
              ],
            };
          });
          frm.fields_dict["items"].grid.get_field("item_price").get_query = function(doc, cdt, cdn)  {
            var d = locals[cdt][cdn];
            return {
                filters: {
                'item_code': d.item,
                'selling': 1,
                'price_list': frm.doc.price_list,
                }
        
            }
        
        }


        frm.set_query("project", function() {
            return {
                "filters": {
                    "customer": frm.doc.customer
                }
            };
        });
    },
    qty:(frm,cdt,cdn)=>{
      let qty =frm.doc.qty
      if(qty > frm.doc.qty_from_comparison){
          frm.set_value("qty",1)
          frappe.throw(`You cant Select QTY More Than ${frm.doc.qty_from_comparison}`)
      }
    },
    calc_stock_items_toals:(frm,cdt,cdn)=>{
         let total = 0
        let all_cost = 0
        let items = frm.doc.items
        for(let i=0 ; i<items.length ; i++){
            total += (items[i].unit_price || 0 )* (items[i].qty || 0)
        }
        all_cost  = total + (frm.doc.total_service_cost ?? 0) + (frm.doc.other_cost ?? 0)
        frm.set_value("total_item_price",total)
        frm.set_value("item_cost",total)
        frm.refresh_field("total_item_price")
        frm.refresh_field("item_cost")
        frm.set_value("total_item_cost",all_cost)
        frm.refresh_field("total_item_cost")
    },
    calc_service_items_toals:(frm,cdt,cdn)=>{
        let total    = 0
        let all_cost = 0
        let items = frm.doc.services
        for(let i=0 ; i<items.length ; i++){
            total += (items[i].unit_price || 0 )* (items[i].qty || 0)
        }
        all_cost  = total + (frm.doc.total_item_price ?? 0) + (frm.doc.other_cost ?? 0)
        frm.set_value("total_service_cost",total)
        frm.set_value("serivce_cost",total)
        frm.refresh_field("total_service_cost")
        frm.refresh_field("serivce_cost")
        frm.set_value("total_item_cost",all_cost)
        frm.refresh_field("total_item_cost")
    },
    calc_over_cost_items_toals:(frm)=>{
        let total = 0
        let all_cost = 0
        let items = frm.doc.cost
        for(let i=0 ; i<items.length ; i++){
            total += items[i].total_amount ?? 0
        }
        all_cost  = total + (frm.doc.total_item_price ?? 0) + (frm.doc.total_service_cost ?? 0)
        frm.set_value("total_cost",total)
        frm.set_value("other_cost",total)
        frm.refresh_field("total_cost")
        frm.refresh_field("other_cost")
        frm.set_value("total_item_cost",all_cost)
        frm.refresh_field("total_item_cost")
    }


    
});


frappe.ui.form.on('Comparison Item Card Stock Item', {
    item:(frm,cdt,cdn)=>{
        let d = locals[cdt][cdn]
        // if(d.item){
        //     let args = {
        //         'item_code'			: d.item,
        //         'company'		: frm.doc.company,
        //         // 'qty'			: d.qty,
        //         'allow_zero_valuation': 1
        //     };
            // frm.call({
            //     method: "contracting_13.contracting_13.doctype.comparison_item_card.comparison_item_card.get_item_details_test",
            //     args:{
            //         args:args
            //     },
            //     callback: function (r) {
            //         // console.log(r.message)
            //         d.uom= r.message.uom
            //         cur_frm.refresh_field("items");
            //     },
            //  });
        // }
        console.log("aa" ,d.item)
        frappe.call({
            "method"  : "contracting_15.contracting_15.doctype.comparison_item_card.comparison_item_card.get_item_uom" ,
            "args" :{
                "item" :d.item
            },callback:function(r){
                console.log(r)
                if (r.message) {
                    console.log(r.message)
                    d.uom= r.message 
                    frm.refresh_field("items")
                }
            }
        })
        cur_frm.fields_dict["items"].grid.get_field("item_price").get_query = function(doc) {
            console.log('test---')
            return {
                filters: {
                'item_code': row.item,
                }
        
            }
        
        }
        frm.refresh_field('items')
        if(frm.doc.price_list){
            frm.call({
                doc: frm.doc,
                args : {"item" : d.item },
                method: "fetch_item_price",
                callback: function (r) {
                    if (r.message){
                        d.item_price = r.message
                        frm.call({
                            doc: frm.doc,
                            method: "validat_item",
                            args :{ "item_price" : d.item_price , "item" : d.item},
                            callback: function (r) {
                                if (r.message){
                                    console.log(r.message)
                                    d.unit_price = r.message || 0.0
                                    frm.refresh_fields("items")
                                }
                            },
                        });
                    }
                },
            });
 
        }
    },   
    item_price :(frm,cdt,cdn)=>{
        let row = locals[cdt][cdn]
        if (row.item && row.item_price){
            frm.call({
                doc: frm.doc,
                method: "validat_item",
                args :{ "item_price" : row.item_price , "item" : row.item},
                callback: function (r) {
                    if (r.message){
                        row.unit_price = r.message
                        frm.refresh_fields("items")
                    }
                },
                });
        }
    },
	unit_price:(frm,cdt,cdn)=>{
        let row = locals[cdt][cdn]
        row.total_amount = (row.qty || 0 ) *  (row.unit_price || 0)
       frm.events.calc_stock_items_toals(frm,cdt,cdn)
    },
    qty:(frm,cdt,cdn)=>{
        let row = locals[cdt][cdn]
         row.total_amount = (row.qty || 0) *  (row.unit_price || 0)
        frm.events.calc_stock_items_toals(frm,cdt,cdn)
    },
    items_remove:(frm,cdt,cdn)=>{
        frm.events.calc_stock_items_toals(frm,cdt,cdn)
    }
});


frappe.ui.form.on('Comparison Item Card Service Item', {
    item_code:(frm,cdt,cdn)=>{
        let d = locals[cdt][cdn]
        if (d.item_price){
            frm.call({
                doc: frm.doc,
                method: "validat_item",
                args :{ "item_price" : d.item_price , "item" : d.item_code},
                callback: function (r) {
                    if (r.message){
                        console.log(r.message)
                        d.unit_price = r.message || 0.0
                        frm.refresh_fields("services")
                    }
                },
            });
        }
    },
	unit_price:(frm,cdt,cdn)=>{
        let row = locals[cdt][cdn]
        row.total_amount = (row.qty || 0 ) *  (row.unit_price || 0)
       frm.events.calc_service_items_toals(frm,cdt,cdn)
        frm.refresh_fields("services")
    },
    item_price :(frm,cdt,cdn)=>{
        let row = locals[cdt][cdn]
        if (row.item_code){
            frm.call({
                doc: frm.doc,
                method: "validat_item",
                args :{ "item_price" : row.item_price , "item" : row.item_code},
                callback: function (r) {
                    if (r.message){
                        row.unit_price = r.message || 0.0
                        frm.refresh_fields("services")
                    }
                },
                });
        }
    },
    qty:(frm,cdt,cdn)=>{
        let row = locals[cdt][cdn]
         row.total_amount = (row.qty || 0) *  (row.unit_price || 0)
        frm.events.calc_service_items_toals(frm,cdt,cdn)
         frm.refresh_fields("services")
    },
    services_remove:(frm,cdt,cdn)=>{
        frm.events.calc_service_items_toals(frm,cdt,cdn)
    }
});
frappe.ui.form.on('Over Cost Item', {
	total_amount:(frm,cdt,cdn)=>{
        frm.events.calc_over_cost_items_toals(frm);
    },
    cost_remove:(frm,cdt,cdn)=>{
        frm.events.calc_over_cost_items_toals(frm);
    }

});
