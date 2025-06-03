#pragma once

#include <string>

namespace sim::utils
{

    enum class LogLevel
    {
        Debug,
        Info,
        Warning,
        Error
    };

    class Logger
    {
    public:
        static void setLevel(LogLevel level);

        static void log(const std::string &message, LogLevel level = LogLevel::Info);

        static void debug(const std::string &message);
        static void info(const std::string &message);
        static void warning(const std::string &message);
        static void error(const std::string &message);
    };

} // namespace sim::utils
