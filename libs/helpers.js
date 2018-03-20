module.exports = {
    htmlEntities: function(str){
        return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    getRandomString: function(num){
        var str = '0t1T2h3H4e5E6q7Q8u9U0i1I2c3C4k5K6b7B8r9R0o1O2w3W4n5N6f7F8o9O0x1X2j3J4u5U6m7M8p9P0o1O2v3V4e5E6r7R8t9T0h1H2e3E4l5L6a7A8z9Z0y1Y2d3D4o5O6g7G89';
        var randStr = '';
        for(let i = 0; i<num;i++)
        {
            randStr += str[Math.floor(Math.random()*str.length)];
        }
        return randStr;

    }
}