const isValidJSON = (data) => {
    try {
        return JSON.parse(data);
    }
    catch {
        return false
    }
}

module.exports.isValidJSON = isValidJSON;