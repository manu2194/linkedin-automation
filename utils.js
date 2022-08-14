/**
 *  Wait for `time` number of milliseconds
 * @param {number} time  - The amount of time to wait in milliseconds
 * @returns 
 */
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

 module.exports = {
    delay
 }