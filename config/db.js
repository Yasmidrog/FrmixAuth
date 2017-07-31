module.exports = {
    'url' : `mongodb://localhost/${process.env.NODE_ENV==='production'?'gopus':"gopus"}`,

};