const Book = require("../../models/Book");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const counter_url = process.env.COUNTER_URL;

const bookController = {
  getBooks: async (req, res) => {
    try {
      const books = await Book.find();
      res.json(books);
    } catch (error) {
      res.json({ error: error });
    }
  },

  getBookById: async (req, res) => {
    try {
      const { id } = req.params;

      const book = await Book.findById(id);

      if (!book) {
        res.status(404).json({ error: "Not found" });
      } else {
        const countIncrUrl = counter_url + "/counter" + "/" + id + "/incr";
        const { data } = await axios.post(countIncrUrl);
        res.json({ ...book.toObject(), count: data.count });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createBook: async (req, res) => {
    try {
      const newBook = new Book(req.body);
      await newBook.save();
      res.json(newBook);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateBook: async (req, res) => {
    try {
      const { id } = req.params;

      const book = await Book.findByIdAndUpdate(id, req.body);

      if (!book) {
        res.status(404).json({ error: "Not found" });
      } else {
        const updatedBook = await Book.findById(id);
        res.json(updatedBook);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteBook: async (req, res) => {
    try {
      const { id } = req.params;

      const book = await Book.findByIdAndDelete(id);

      if (!book) {
        res.status(404).json({ error: "Not found" });
      } else {
        res.json(book);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  uploadFile: async (req, res) => {
    try {
      const { id } = req.params;

      const book = await Book.findById(id);

      if (!book) {
        res.status(404).json({ error: "Not found" });
      } else {
        const fileBook = `database/fileBooks/${req.file.filename}`;
        await Book.findByIdAndUpdate(id, {
          ...book.toObject,
          fileBook,
        });
        const updatedBook = await Book.findById(id);
        res.json(updatedBook);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteFile: async (req, res) => {
    try {
      const { id } = req.params;

      const book = await Book.findById(id);

      if (!book) {
        res.status(404).json({ error: "Not found" });
      } else {
        if (book.fileBook) {
          // Получаем текущий путь к файлу, где выполняется скрипт
          const currentFilePath = __filename;

          // Формируем путь к директории routes
          const routesDirectory = path.dirname(currentFilePath);

          // Формируем путь к директории database относительно директории routes
          const databaseDirectory = path.join(routesDirectory, "../");

          // Формируем новый путь к файлу
          const newFilePath = path.join(databaseDirectory, book.fileBook);

          if (fs.existsSync(newFilePath)) {
            fs.unlinkSync(newFilePath);
          }
        }

        await Book.updateOne({ _id: id }, { $unset: { fileBook: 1 } });
        res.json({ success: true });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  downloadFile: async (req, res) => {
    const { id } = req.params;
    const book = await Book.findById(id);

    // Проверка, что такая книга существует
    if (book) {
      const databaseDirectory = path.join(__dirname, "../../");
      const newFilePath = path.join(databaseDirectory, book.fileBook);

      // Проверка, что существует файл, путь к которому хранит объект книги. Если файла нет вернуть 500, т.к. нарушена консистентность данных
      if (fs.existsSync(newFilePath)) {
        res.download(newFilePath, book.fileName, (error) => {
          if (error) {
            console.log("Ошибка при скачивании файла:", err);
            res.status(500).json("Ошибка при скачивании файла");
          }
        });
      } else {
        res.status(500);
        res.json("Файл не удалось найти");
        return;
      }
    } else {
      res.status(404);
      res.json("404 | Книга не найдена");
    }
  },
};

module.exports = bookController;
