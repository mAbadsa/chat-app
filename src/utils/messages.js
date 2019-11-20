const generateMessages = (username, text) => {
    return {
        username: username,
        text: text,
        createAt: new Date().getTime()
    }
}
const generateLocation = (username, url) => {
    return {
        username: username,
        url: url,
        createAt: new Date().getTime()
    }
}

module.exports = {
    generateMessages,
    generateLocation
}