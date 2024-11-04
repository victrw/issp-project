exports.getPersonalizedWordList = (req, res) => {
    const personalizedWordList = []; // Replace with actual logic to get data
    // Render a view or send a JSON response
    res.render('personalized_wordlist', { wordList: personalizedWordList });
};