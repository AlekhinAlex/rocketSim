#include <iostream>
#include <sstream>
#include <termcolor/termcolor.hpp>
#include "../../include/utils/logger.hpp"

namespace sim::utils
{

    static LogLevel currentLogLevel = LogLevel::Debug;

    void Logger::setLevel(LogLevel level)
    {
        currentLogLevel = level;
    }

    void Logger::log(const std::string &message, LogLevel level)
    {
        if (level < currentLogLevel || currentLogLevel == LogLevel::None)
        {
            return;
        }

        std::string levelText;

        switch (level)
        {
        case LogLevel::None:
            return;
        case LogLevel::Debug:
            levelText = "DEBUG";
            break;
        case LogLevel::Info:
            levelText = "INFO";
            break;
        case LogLevel::Warning:
            levelText = "WARN";
            break;
        case LogLevel::Error:
            levelText = "ERROR";
            break;
        default:
            throw std::invalid_argument("Invalid log level");
        }

        std::cout << "[";
        switch (level)
        {
        case LogLevel::None:
            return;
        case LogLevel::Debug:
            std::cout << termcolor::cyan << levelText << termcolor::reset;
            break;
        case LogLevel::Info:
            std::cout << termcolor::green << levelText << termcolor::reset;
            break;
        case LogLevel::Warning:
            std::cout << termcolor::yellow << levelText << termcolor::reset;
            break;
        case LogLevel::Error:
            std::cout << termcolor::red << levelText << termcolor::reset;
            break;
        }
        std::cout << "] " << message << std::endl;
    }

    void Logger::debug(const std::string &message)
    {
        log(message, LogLevel::Debug);
    }

    void Logger::info(const std::string &message)
    {
        log(message, LogLevel::Info);
    }

    void Logger::warning(const std::string &message)
    {
        log(message, LogLevel::Warning);
    }

    void Logger::error(const std::string &message)
    {
        log(message, LogLevel::Error);
    }

}
