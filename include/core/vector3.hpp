#pragma once

namespace sim::core
{

    class Vector3
    {
    private:
        double x_, y_, z_;

    public:
        Vector3();
        Vector3(double x, double y, double z);

        double x() const;
        double y() const;
        double z() const;

        void setX(double x);
        void setY(double y);
        void setZ(double z);

        static double angle(const Vector3 &first, const Vector3 &second);
        static Vector3 slerp(const Vector3 &start, const Vector3 &end, double factor);

        Vector3 cross(const Vector3 &other) const;

        double length() const;
        Vector3 normalized() const;

        Vector3 operator+(const Vector3 &other) const;
        Vector3 operator-(const Vector3 &other) const;
        Vector3 operator*(double scalar) const;
        Vector3 operator/(double scalar) const;

        Vector3 &operator+=(const Vector3 &other);
        Vector3 &operator-=(const Vector3 &other);

        double dot(const Vector3 &other) const;

        Vector3 &operator=(const Vector3 &other);
        Vector3 operator-() const;
    };

} // namespace sim::core
