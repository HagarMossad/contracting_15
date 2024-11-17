// Copyright (c) 2024, hagermossad80@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on("Comparison Item Log", {
    onload:function(frm){
        frm.ignore_doctypes_on_cancel_all = ['Comparison'];
    },
    refresh: function(frm) {
        frm.ignore_doctypes_on_cancel_all = ['Comparison'];
    }
});
