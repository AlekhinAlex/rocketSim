cmake_minimum_required(VERSION 3.15)
project(rocket_sim)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# THIS HAS TO BE REMOVED (optional)
include_directories(/opt/homebrew/Cellar/termcolor/2.1.0/include)

option(BUILD_WASM "Build WebAssembly version" OFF)

if(BUILD_WASM)
    set(CMAKE_EXECUTABLE_SUFFIX ".js")
    add_definitions(-DUSE_EMSCRIPTEN)
    # set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=4")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORTED_RUNTIME_METHODS=ccall,cwrap -s EXPORT_NAME='createRocketSimModule' -s ALLOW_MEMORY_GROWTH=1 --bind")
endif()

include_directories(include)

if(NOT BUILD_WASM)
    find_package(termcolor QUIET)
    if(termcolor_FOUND)
        include_directories(${termcolor_INCLUDE_DIRS})
        add_definitions(-DHAVE_TERMCOLOR)
    else()
        message(WARNING "termcolor not found. Logs will not be colored.")
    endif()
endif()

file(GLOB_RECURSE SOURCES "src/*.cpp")
file(GLOB_RECURSE HEADERS "include/*.hpp")

if(BUILD_WASM)
    list(FILTER SOURCES EXCLUDE REGEX ".*/main.cpp$")
    add_executable(${PROJECT_NAME} ${SOURCES} ${HEADERS})
    
    file(MAKE_DIRECTORY ${CMAKE_SOURCE_DIR}/docs/wasm)
    
    add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy
            ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.js
            ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.wasm
            ${CMAKE_SOURCE_DIR}/docs/wasm/
        COMMENT "Copying WebAssembly files to docs/wasm directory"
    )
else()
    add_executable(${PROJECT_NAME} main.cpp ${SOURCES} ${HEADERS})
endif()

endif()