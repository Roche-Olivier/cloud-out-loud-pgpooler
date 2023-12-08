

exports.shared = {
    _return_object: function (jsonResult, haserror, code) {
        return {
            jsonResult: jsonResult,
            haserror: haserror,
            code: code,
        }
    }
}