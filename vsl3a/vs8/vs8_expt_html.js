/**
 * short hand for showing instruction and wait for user input
 * @param {HTMLElement} ele 
 * @param {String} html 
 * @param {Object} wait 
 */
async function wait_instruction(ele, html, wait) {
    let d2 = add({ ele: ele, tag: 'div', class: 'instructiondiv' });
    addhtml(d2, html);
    if (wait.type == 'forever') await wait_forever();

    d2.remove();
}