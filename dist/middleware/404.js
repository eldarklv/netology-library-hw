"use strict";
module.exports = (req, res) => {
    res.render("errors/404", {
        title: "404 | Не найдено",
    });
};
