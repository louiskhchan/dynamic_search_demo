let table = add({
    tag: 'table'
});

let btws = {
    ttype_order: ['colorfirst', 'orifirst'],
    ssize_order: ['smallssfirst', 'largessfirst']
};
btw_conds = permu_conds(btws);

for (let i = 0; i < 50; i++) {
    let ir = i % btw_conds.length;
    if (i != 0 && ir == 0) add({
        ele: table,
        tag: 'tr'
    });
    let query = {
        id: unique_id(),
        ...btw_conds[ir]
    };



    let urlparam = create_url_params(query);
    let url = window.location.href.match(/(.*)\/.*/)[1] + '/index.htm?' + urlparam;
    let tr = add({
        ele: table,
        tag: 'tr'
    });
    let td1 = add({
        ele: tr,
        tag: 'td',
        text: i + 1
    });
    let td2 = add({
        ele: tr,
        tag: 'td'
    });
    let input = add({
        ele: td2,
        tag: 'input',
        style: 'width:800px;font-family:Consolas,Monaco,Courier New',
        attr: {
            type: 'text',
            value: url
        }
    });
    let td3 = add({
        ele: tr,
        tag: 'td'
    });
    let selbut = add({
        ele: td3,
        tag: 'button',
        text: 'Copy link'
    });
    selbut.onclick = function() {
        navigator.clipboard.writeText(input.value);
    };
    let td4 = add({
        ele: tr,
        tag: 'td'
    });
    let gobut = add({
        ele: td4,
        tag: 'button',
        text: 'Go to link'
    });
    gobut.onclick = function() {
        window.open(input.value, "_blank");
    };
}