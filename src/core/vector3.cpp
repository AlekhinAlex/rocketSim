#include "../../include/core/vector3.hpp"
#include "../../include/utils/config.hpp"
#include <cmath>
#include <algorithm>

namespace sim::core
{

    Vector3::Vector3() : x_(0.0), y_(0.0), z_(0.0) {}
    Vector3::Vector3(double x, double y, double z) : x_(x), y_(y), z_(z) {}

    double Vector3::x() const
    {
        return x_;
    }

    double Vector3::y() const
    {
        return y_;
    }

    double Vector3::z() const
    {
        return z_;
    }

    void Vector3::setX(double x)
    {
        x_ = x;
    }

    void Vector3::setY(double y)
    {
        y_ = y;
    }

    void Vector3::setZ(double z)
    {
        z_ = z;
    }

    double Vector3::length() const
    {
        return std::sqrt(x_ * x_ + y_ * y_ + z_ * z_);
    }

    Vector3 Vector3::normalized() const
    {

        if (length() <= 1e-10)
        {
            return Vector3(0, 0, 0);
        }

        return Vector3(x_ / length(), y_ / length(), z_ / length());
    }

    Vector3 Vector3::operator+(const Vector3 &other) const
    {
        return Vector3(x_ + other.x(), y_ + other.y(), z_ + other.z());
    }

    Vector3 Vector3::operator-(const Vector3 &other) const
    {
        return Vector3(x_ - other.x(), y_ - other.y(), z_ - other.z());
    }

    Vector3 Vector3::operator*(double scalar) const
    {
        return Vector3(x_ * scalar, y_ * scalar, z_ * scalar);
    }

    Vector3 Vector3::operator/(double scalar) const
    {
        return Vector3(x_ / scalar, y_ / scalar, z_ / scalar);
    }

    Vector3 &Vector3::operator+=(const Vector3 &other)
    {
        x_ += other.x();
        y_ += other.y();
        z_ += other.z();

        return *this;
    }

    Vector3 &Vector3::operator-=(const Vector3 &other)
    {
        x_ -= other.x_;
        y_ -= other.y_;
        z_ -= other.z_;

        return *this;
    }

    Vector3 &Vector3::operator=(const Vector3 &other)
    {
        x_ = other.x_;
        y_ = other.y_;
        z_ = other.z_;

        return *this;
    }

    Vector3 Vector3::operator-() const
    {
        return Vector3(-x_, -y_, -z_);
    }

    double Vector3::angle(const Vector3 &first, const Vector3 &second)
    {
        Vector3 v1 = first.normalized();
        Vector3 v2 = second.normalized();
        double cos = v1.x() * v2.x() + v1.y() * v2.y() + v1.z() * v2.z();

        return std::acos(std::clamp(cos, -1.0, 1.0)) * 180.0 / sim::utils::config::PI;
    }

    double Vector3::dot(const Vector3 &other) const
    {
        return x_ * other.x() + y_ * other.y() + z_ * other.z();
    }

    Vector3 Vector3::slerp(const Vector3 &start, const Vector3 &end, double factor)
    {
        double dot = start.dot(end);
        dot = std::clamp(dot, -1.0, 1.0);

        double theta = std::acos(dot) * factor;
        Vector3 relativeVec = end - start * dot;
        if (relativeVec.length() < 1e-10)
        {
            return start;
        }
        relativeVec = relativeVec.normalized();

        return start * std::cos(theta) + relativeVec * std::sin(theta);
    }

    Vector3 Vector3::cross(const Vector3 &other) const
    {
        return Vector3(
            y_ * other.z() - z_ * other.y(),
            z_ * other.x() - x_ * other.z(),
            x_ * other.y() - y_ * other.x());
    }

}