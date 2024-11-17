// Copyright (c) 2024, hagermossad80@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on("Comparison", {
    onload:function(frm){        
        frm.ignore_doctypes_on_cancel_all = [' Comparison Item Log'];
        frm.ignore_doctypes_on_cancel_all = ['Comparison Item Card'];
   },
    setup(frm) {
      frm.set_query("project", function() {
        return {
            "filters": {
                "customer": frm.doc.customer
            }
        };
    });
      frm.set_query("account_head", "taxes", function () {
        return {
          filters: [
            ["company", "=", frm.doc.company],
            ["is_group", "=", 0],
            [
              "account_type",
              "in",
              [
                "Tax",
                "Chargeable",
                "Income Account",
                "Expenses Included In Valuation",
              ],
            ],
          ],
        };
      });
  
      frm.set_query("cost_center", "taxes", function () {
        return {
          filters: [
            ["company", "=", frm.doc.company],
            ["is_group", "=", 0],
          ],
        };
      });
      frm.set_query("cost_center", "item", function () {
        return {
          filters: [
            ["company", "=", frm.doc.company],
            ["is_group", "=", 0],
          ],
        };
      });
    },
    refresh: (frm) => {
  
      frm.set_query("purchase_taxes_and_charges_template", function() {
        return {
            "filters": {
                "company": frm.doc.company
            }
        };
      });
      
      
      frm.events.setup_function(frm)
      if (frm.doc.docstatus == 1 && frm.doc.status !="Ordered") {
          console.log("custom_button");
          
        frm.events.add_custom_btn_event(frm)
        frm.add_custom_button(
            __("Sales Order"),
            function () {
                //console.log("fom s order")
                frappe.model.open_mapped_doc({
                    method:
                "contracting_15.contracting_15.doctype.comparison.comparison.make_sales_order",
                frm: frm, //this.frm
            });
        },
        __("Create")
        );
    }
        if (frm.doc.docstatus == 1){
  
        //   frappe.call({
        //     method: "contracting_15.contracting_15.controllers.sales_order.get_un_invoice_clearance" ,
        //     "args" : {"comparison" : frm.doc.name} ,
        //     callback:function(r){
        //         if (r.message ) {
        //             var clearances = r.message
        //             console.log(clearances)
        //       if (clearances > 0 ) {
                  
        //           frm.add_custom_button(
        //               __("Grand Clearance"),
        //           function () {
                   
        //               frappe.model.open_mapped_doc({
        //                   method:
        //                 "contracting_13.contracting_13.doctype.clearance.clearance.create_grand_clearance_from_comparison",
        //                 frm: frm,
        //             });
        //             //frm.events.make_purchase_order(frm);
        //           },
        //           __("Create")
        //         );
        
        //     }
        //      }
        //     }
        //   })

          // frm.add_custom_button(
            //   __("Grand Clearance"),
            //   function () {
                
            //     frappe.model.open_mapped_doc({
                //       method:
        //         "contracting_13.contracting_13.doctype.clearance.clearance.create_grand_clearance_from_comparison",
        //       frm: frm,
        //     });
        //     //frm.events.make_purchase_order(frm);
        //   },
        //   __("Create")
        // );
        
        
        // frm.add_custom_button(
        //   __("Purchase Order"),
        //   function () {
        //       frm.events.make_purchase_order(frm);
        //     },
        //     __("Create")
        // );
        //if (frm.doc.insurance_payment == 0) {
            
        let can_create = frm.doc.insurances.some(
            (item) =>
                !item.invocied &&
            !item.returned &&
            ["For a Specified Period", "Expenses"].includes(
                item.type_of_insurance
            )
        );
  
        if (can_create) {
          frm.add_custom_button(
              __("Insurance Payment"),
              function () {
              //frm.events.make_purchase_order(frm);
              frappe.call({
                method: "create_insurance_payment",
                doc: frm.doc,
              });
            },
            __("Create")
        );
    }
    
    let can_return = frm.doc.insurances.some(
          (item) =>
            item.invocied &&
          !item.returned &&
          ["For a Specified Period"].includes(item.type_of_insurance)
        );
        if (can_return) {
          frm.add_custom_button(
              __("Insurance Return"),
            function () {
              //frm.events.make_purchase_order(frm);
              frappe.call({
                  method: "create_insurance_return",
                  doc: frm.doc,
              });
            },
            __("Create")
        );
    }
      }
      if (frm.doc.docstatus == 0) {
          frm.add_custom_button(
              __("item Cart"),
              function () {
                  //console.log("fom s order")
                  //var me = this;
                  frm.call({
                      doc: frm.doc,
              method: "get_items",
              callback: function (r) {
                if (!r.message) {
                    frappe.msgprint({
                    title: __("Items Cart not created"),
                    message: __("No Items"),
                    indicator: "orange",
                  });
                  return;
                } else {
                    const fields = [
                        {
                            label: "Items",
                      fieldtype: "Table",
                      fieldname: "items",
                      description: __("Create Item Cart"),
                      fields: [
                          {
                          fieldtype: "Read Only",
                          fieldname: "item_code",
                          label: __("Item Code"),
                          in_list_view: 1,
                        },
                        {
                            fieldtype: "Read Only",
                          fieldname: "qty",
                          label: __("Qty"),
                          in_list_view: 1,
                        },
                        {
                          fieldtype: "Read Only",
                          fieldname: "price",
                          reqd: 1,
                          label: __("Price"),
                          in_list_view: 1,
                        },
                        {
                          fieldtype: "Read Only",
                          fieldname: "total",
                          reqd: 1,
                          label: __("Total"),
                          in_list_view: 1,
                        },
                      ],
                      data: r.message,
                      get_data: () => {
                          return r.message;
                      },
                    },
                ];
                  var d = new frappe.ui.Dialog({
                    title: __("Select Items"),
                    fields: fields,
                    primary_action: function () {
                      var data = {
                        items: d.fields_dict.items.grid.get_selected_children(),
                    };
                    frm.call({
                        method: "create_item_cart",
                        args: {
                            items: data,
                            comparison: frm.docname,
                          tender: frm.doc.tender,
                        },
                        freeze: true,
                        callback: function (r) {
                          if (r.message) {
                            frappe.msgprint({
                                message: __("Created Successfully"),
                              indicator: "green",
                            });
                          }
                          d.hide();
                        },
                      });
                    },
                    primary_action_label: __("Create"),
                  });
                  d.show();
                }
              },
            });
          },
          __("Create")
        );
        
      }
      
      frm.events.export_data_file(frm , "item")
      frm.events.upload_data_file(frm , "item")
    },
    setup_function: function(frm) {
        
      if (frm.doc.docstatus == 0) {
          
          frm.add_custom_button(
              __("Update Price"),
              function () {
              //console.log("fom s order")
              frappe.call(
                  {
                      "method" :"update_prices_from_item_card" ,
                      "doc"    : frm.doc,
                      
                  }
              )
            
            },
            __("Update")
          );
      }
  },
    add_custom_btn_event:function(frm){
      frm.add_custom_button(
        __("Make Quotation"),
        function () {
          frappe.model.open_mapped_doc({
            method: "contracting_15.contract_api.create_quotation",
            frm: frm, 
          });
        },
        __("Create")
      );
      // frm.add_custom_button(
      //   __("Make Clearance"),
      //   function () {
      //     frappe.model.open_mapped_doc({
      //       method: "",
      //       frm: frm, 
      //     });
      //   },
      //   __("Create")
      // );
    },
  
    make_purchase_order: function (frm) {
      let pending_items = (frm.doc.item || []).some((item) => {
        let pending_qty = flt(item.qty) - flt(item.purchased_qty || 0);
        return pending_qty > 0;
      });
      // let pending_items = frm.doc.item;
      if (!pending_items) {
        frappe.throw({
          message: __("Purchase Order already created for all Comparison items"),
          title: __("Note"),
        });
      }
      let pending_list = (frm.doc.item || []).filter((item) => {
        let pending_qty = flt(item.qty) - flt(item.purchased_qty || 0);
        return pending_qty > 0;
      });
  
      var dialog = new frappe.ui.Dialog({
        title: __("Select Items"),
        fields: [
          {
            fieldtype: "Check",
            label: __("Against Default Supplier"),
            fieldname: "against_default_supplier",
            default: 0,
            hidden: 1,
          },
          {
            fieldname: "items_for_po",
            fieldtype: "Table",
            label: "Select Items",
            fields: [
              {
                fieldtype: "Data",
                fieldname: "item_code",
                label: __("Item"),
                read_only: 1,
                in_list_view: 1,
              },
              {
                fieldtype: "Data",
                fieldname: "item_name",
                label: __("Item name"),
                read_only: 1,
                in_list_view: 1,
              },
              {
                fieldtype: "Float",
                fieldname: "pending_qty",
                label: __("Pending Qty"),
                read_only: 1,
                in_list_view: 1,
              },
              {
                fieldtype: "Link",
                read_only: 1,
                fieldname: "uom",
                label: __("UOM"),
                in_list_view: 1,
              },
  
              // {
              //   fieldtype: "Data",
              //   fieldname: "supplier",
              //   label: __("Supplier"),
              //   read_only: 1,
              //   in_list_view: 1,
              // },
            ],
            data: pending_list,
            get_data: () => {
              return pending_list;
            },
          },
        ],
        primary_action_label: "Create Purchase Order",
        primary_action(args) {
          if (!args) return;
  
          let selected_items =
            dialog.fields_dict.items_for_po.grid.get_selected_children();
          if (selected_items.length == 0) {
            frappe.throw({
              message: "Please select Items from the Table",
              title: __("Items Required"),
              indicator: "blue",
            });
          }
  
          dialog.hide();
  
          return frappe.call({
            method:
              "contracting_15.contracting_15.doctype.comparison.comparison.make_purchase_order",
            freeze: true,
            freeze_message: __("Creating Purchase Order ..."),
            args: {
              source_name: frm.doc.name,
              selected_items: selected_items,
            },
            callback: function (r) {
              if (!r.exc) {
                if (!args.against_default_supplier) {
                  frappe.model.sync(r.message);
                  frappe.set_route("Form", r.message.doctype, r.message.name);
                } else {
                  frappe.route_options = {
                    sales_order: me.frm.doc.name,
                  };
                  frappe.set_route("List", "Purchase Order");
                }
              }
            },
          });
        },
      });
  
      dialog.fields_dict["against_default_supplier"].df.onchange = () =>
        set_po_items_data(dialog);
  
      function set_po_items_data(dialog) {
        var against_default_supplier = dialog.get_value(
          "against_default_supplier"
        );
        var items_for_po = dialog.get_value("items_for_po");
  
        if (against_default_supplier) {
          let items_with_supplier = items_for_po.filter((item) => item.supplier);
  
          dialog.fields_dict["items_for_po"].df.data = items_with_supplier;
          dialog.get_field("items_for_po").refresh();
        } else {
          let po_items = [];
          frm.doc.item.forEach((d) => {
            let pending_qty = flt(d.qty) - flt(d.purchased_qty || 0);
            if (pending_qty > 0) {
              po_items.push({
                doctype: "Comparison Item",
                name: d.name,
                item_name: d.clearance_item_name,
                item_code: d.clearance_item,
                pending_qty: pending_qty,
                uom: d.uom,
              });
            }
          });
  
          dialog.fields_dict["items_for_po"].df.data = po_items;
          dialog.get_field("items_for_po").refresh();
        }
      }
  
      set_po_items_data(dialog);
      dialog.get_field("items_for_po").grid.only_sortable();
      dialog.get_field("items_for_po").refresh();
      dialog.wrapper.find(".grid-heading-row .grid-row-check").click();
      dialog.show();
    },
    validate_customer: (frm) => {
      let customer = frm.doc.customer;
      let contractor = frm.doc.contractor;
      if (customer == contractor) {
        frm.set_value("customer", "");
        frm.set_value("customer_name", "");
        frm.set_value("contractor", "");
        frm.set_value("contractor_name", "");
        frappe.throw("Customer Must Be different Than Contractor");
      }
    },
    customer: (frm) => {
      if (frm.doc.customer != "") {
        frm.events.validate_customer(frm);
      }
      frm.set_query("project", () => {
       return { filters: {customer : frm.doc.customer} };
     });
    },
    contractor: (frm) => {
      if (frm.doc.contractor) {
        frm.events.validate_customer(frm);
      }
    },
  
    clac_taxes: (frm) => {
      let items = frm.doc.item || [];
      let taxes = frm.doc.taxes || [];
      let totals = 0;
      let total_qty = 0;
      let totals_after_tax = 0;
      let total_tax_rate = 0;
      let total_tax = 0;
      let tax_table = [];
      for (let i = 0; i < items.length; i++) {
        totals += parseFloat(items[i].total_price || 0);
        total_qty += parseInt(items[i].qty || 0);
      }
  
      let tax_v = parseFloat(totals || 0);
      for (let i = 0; i < taxes.length; i++) {
        total_tax_rate += taxes[i].rate;
        taxes[i].tax_amount = (taxes[i].rate / 100) * totals;
        tax_v += parseFloat(taxes[i].tax_amount);
        //taxes[i].total = (taxes[i].rate  / 100) *  totals + totals
        if (i == 0) {
          taxes[i].total = tax_v; //(taxes[i].rate  / 100) * totals + totals
        } else {
          taxes[i].total = tax_v; //(taxes[i-1].total || totals) + taxes[i].tax_amount
        }
        tax_table.push(taxes[i]);
      }
  
      total_tax = totals * (total_tax_rate / 100);
      totals_after_tax = parseFloat(totals) + parseFloat(total_tax);
      //////  clear child table and add row from scratch to update amount value
      cur_frm.clear_table("taxes");
      for (let i = 0; i < tax_table.length; i++) {
        let row = cur_frm.add_child("taxes");
        row.charge_type = tax_table[i].charge_type;
        row.account_head = tax_table[i].account_head;
        row.cost_center = tax_table[i].cost_center;
        row.rate = tax_table[i].rate;
        row.tax_amount = tax_table[i].tax_amount;
        row.total = tax_table[i].total;
      }
  
      ////// calc insurance
      let insurance_value =
        (totals_after_tax * frm.doc.insurance_value_rate) / 100;
      let delivery_value =
        (totals_after_tax * frm.doc.delevery_insurance_value_rate_) / 100;
      let total_ins = insurance_value + delivery_value;
      frm.set_value("total_insurance", parseFloat(total_ins));
      frm.set_value("insurance_value", parseFloat(insurance_value));
      frm.set_value("delivery_insurance_value", parseFloat(delivery_value));
      frm.refresh_fields("taxes");
      frm.set_value("total_qty", parseFloat(total_qty));
      frm.set_value("total_price", parseFloat(totals));
      frm.set_value("tax_total", parseFloat(total_tax));
      frm.set_value("total", parseFloat(totals_after_tax));
      frm.set_value("grand_total", parseFloat(totals_after_tax));
      frm.refresh_field("total_qty");
      frm.refresh_field("total_price");
      frm.refresh_field("tax_total");
      frm.refresh_field("grand_total");
      frm.refresh_field("total");
      frm.refresh_field("total_insurance");
    },
  
    start_date: function (frm) {
      let start_date = new Date(frm.doc.start_date);
      let end_date = new Date(frm.doc.end_date);
      let now = new Date();
      start_date.setDate(start_date.getDate() + 1);
      // if (start_date < now) {
      //   frm.set_value("start_date", "");
      //   frappe.throw("Start Date Should Be After Today");
      // }
      if (end_date < start_date) {
        frm.set_value("start_date", "");
        frm.set_value("end_date", "");
        frappe.throw("End Date Must be After Start Date");
      }
    },
    allow_material_over_price(frm) {
      frm.doc.item.forEach((row) => {
        row.allow_material_over_price = frm.doc.allow_material_over_price;
      });
      frm.refresh_field("item");
    },
    end_date: function (frm) {
      let start_date = new Date(frm.doc.start_date);
      let end_date = new Date(frm.doc.end_date);
      if (end_date < start_date) {
        frm.set_value("start_date", "");
        frm.set_value("end_date", "");
        frappe.throw("End Date Must be After Start Date");
      }
    },
    purchase_taxes_and_charges_template: (frm) => {
      frm.clear_table("taxes")
      if (frm.doc.purchase_taxes_and_charges_template) {
        let tax_temp = frm.doc.taxes_type;
        let doc_type=''
        if (tax_temp=="Purchase Taxes and Charges Template"){
          doc_type = "Purchase Taxes and Charges Template"
        }
        else{
          doc_type = 'Sales Taxes and Charges Template'
        }
        frappe.call({
          method: "contracting_15.contracting_15.doctype.comparison.comparison.get",
          args: {
            doctype: doc_type ,
            name: frm.doc.purchase_taxes_and_charges_template,
          },
          callback: function (r) {
            if (r.message) {
              let taxes = r.message["taxes"];
              //console.log("rrrrrrrrrr",taxes)
              for (let i = 0; i < taxes.length; i++) {
                let row = cur_frm.add_child("taxes");
                row.charge_type = taxes[i].charge_type;
                row.account_head = taxes[i].account_head;
                row.rate = taxes[i].rate;
                row.tax_amount = (taxes[i].rate / 100) * frm.doc.total_price || 0;
                row.total =
                  (taxes[i].rate / 100) * frm.doc.total_price +
                    frm.doc.grand_total || 0;
                row.description = taxes[i].description;
              }
              cur_frm.refresh_fields("taxes");
              frm.events.clac_taxes(frm);
            }
          },
        });
      }
  
      let selected_items =
        dialog.fields_dict.items_for_po.grid.get_selected_children();
      if (selected_items.length == 0) {
        frappe.throw({
          message: "Please select Items from the Table",
          title: __("Items Required"),
          indicator: "blue",
        });
      }
  
      dialog.hide();
  
      return frappe.call({
        method:
          "contracting_15.contracting_13.doctype.comparison.comparison.make_purchase_order",
        freeze: true,
        freeze_message: __("Creating Purchase Order ..."),
        args: {
          source_name: frm.doc.name,
          selected_items: selected_items,
        },
        callback: function (r) {
          if (!r.exc) {
            if (!args.against_default_supplier) {
              frappe.model.sync(r.message);
              frappe.set_route("Form", r.message.doctype, r.message.name);
            } else {
              frappe.route_options = {
                sales_order: me.frm.doc.name,
              };
              frappe.set_route("List", "Purchase Order");
            }
          }
        },
      });
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
    validate: (frm) => {
      //frm.events.clac_taxes(frm)
      if (
        frm.doc.bank_guarantee != null &&
        frm.doc.insurance_method == "Bank Guarantee"
      ) {
        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Bank Guarantee",
            name: frm.doc.bank_guarantee,
          },
          callback: function (r) {
            if (r.message) {
              let obj = r.message;
              if (
                frm.doc.customer != obj.customer &&
                frm.doc.comparison_type == "Direct"
              ) {
                frm.set_value("bank_guarantee", "");
                frappe.throw("Invalid Customer In Bank Guarantee");
              }
              if (
                frm.doc.contractor != obj.customer &&
                frm.doc.comparison_type == "From Contractor"
              ) {
                frm.set_value("bank_guarantee", "");
                frappe.throw("Invalid Customer In Bank Guarantee");
              }
              if (Math.ceil(frm.doc.total_insurance) != Math.ceil(obj.amount)) {
                frappe.throw("Invalid Amount In Bank Guarantee");
              }
            }
          },
        });
      }
    },
  
    insurance_value_rate: (frm) => {
      let insurance_value_rate = frm.doc.insurance_value_rate;
      let ins_value = frm.doc.grand_total * (insurance_value_rate / 100);
      let total_ins = ins_value + (frm.doc.delivery_insurance_value || 0);
      frm.set_value("insurance_value", ins_value);
      frm.set_value("total_insurance", total_ins);
    },
    delevery_insurance_value_rate_: (frm) => {
      let delivery_ins_rate = frm.doc.delevery_insurance_value_rate_;
      let delivery_ins_value = frm.doc.grand_total * (delivery_ins_rate / 100);
      let total_ins = delivery_ins_value + (frm.doc.insurance_value || 0);
      frm.set_value("delivery_insurance_value", delivery_ins_value);
      frm.set_value("total_insurance", total_ins);
    },
  });
  
  frappe.ui.form.on("Comparison Item", {
    clearance_item: (frm, cdt, cdn) => {
      var local = locals[cdt][cdn];
      if (local.clearance_item) {
        frappe.call({
          method:
            "contracting_15.contracting_15.doctype.comparison.comparison.get_item_price",
          args: {
            item_code: local.clearance_item,
          },
          callback(r) {
            if (r.message) {
              local.price = r.message;
              if (local.qty) {
                local.total_price = local.qty * r.message;
              }
              frm.refresh_fields("item");
            }
          },
        });
  
        frappe.call({
          method: "get_cost_center",
          doc: frm.doc,
          args: {
            item_code: local.clearance_item,
          },
          callback(r) {
            if (r.message) {
              local.cost_center = r.message;
              frm.refresh_fields("item");
            }
          },
        });
      }
    },
    qty: (frm, cdt, cdn) => {
      let local = locals[cdt][cdn];
      if (local.qty && local.price) {
        local.total_price = local.qty * local.price;
        local.purchased_qty = 0;
        local.remaining_purchased_qty = local.qty || 0;
        frm.events.clac_taxes(frm);
        frm.refresh_fields("item");
      }
    },
    price: (frm, cdt, cdn) => {
      let local = locals[cdt][cdn];
      local.total_price = local.price * local.qty || 0;
      frm.refresh_fields("item");
      frm.events.clac_taxes(frm);
    },
    item_remove: (frm, cdt, cdn) => {
      frm.events.clac_taxes(frm);
    },
  });
  frappe.ui.form.on("Purchase Taxes and Charges Clearances", {
    rate: (frm, cdt, cdn) => {
      frm.events.clac_taxes(frm);
    },
    taxes_remove: (frm, cdt, cdn) => {
      frm.events.clac_taxes(frm);
    },
    taxes_add: (frm, cdt, cdn) => {
      var row = locals[cdt][cdn];
  
      if (row.rate) {
        frm.events.clac_taxes(frm);
      }
      frappe.call({
        method: "get_cost_center",
        doc: frm.doc,
        args: {
          item_code: "",
        },
        callback(r) {
          if (r.message) {
            row.cost_center = r.message;
            frm.refresh_fields("taxes");
          }
        },
      });
    },
});


frappe.form.link_formatters['Project'] = function(value, doc) {
	// console.log('5555555')
	console.log(`value==>${value}--doc-${doc}`)
	if (doc && value && doc.customer ) {
		return value + ': ' + doc.customer;
	} 
	else {
		// if value is blank in report view or item code and name are the same, return as is
		return value;
	}
}