cmake_minimum_required(VERSION 3.10)
project(rocket_sim)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include directories
include_directories(include)
include_directories(/opt/homebrew/Cellar/termcolor/2.1.0/include)


# Find all source files recursively
file(GLOB_RECURSE SOURCES 
    "src/*.cpp"
)

# Find all header files recursively
file(GLOB_RECURSE HEADERS 
    "include/*.hpp"
)

# Main executable
add_executable(${PROJECT_NAME} 
    main.cpp
    ${SOURCES}
    ${HEADERS}
)

# Optional: Add testing support
option(BUILD_TESTS "Build the tests" OFF)
if(BUILD_TESTS)
    enable_testing()
    find_package(GTest REQUIRED)
    include(GoogleTest)
    
    # Test executable
    file(GLOB_RECURSE TEST_SOURCES "tests/*.cpp")
    add_executable(run_tests ${TEST_SOURCES} ${SOURCES})
    target_link_libraries(run_tests GTest::GTest GTest::Main)
    gtest_discover_tests(run_tests)
endif()