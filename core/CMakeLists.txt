cmake_minimum_required(VERSION 3.16)
project(payable_core LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(MSVC)
  add_compile_options(/W4 /permissive-)
else()
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

add_library(payable_core src/card_network.cpp src/validator.cpp)
target_include_directories(payable_core PUBLIC include)

add_executable(payable-cli src/cli.cpp)
target_link_libraries(payable-cli PRIVATE payable_core)

enable_testing()
add_executable(payable_tests tests/test_validator.cpp)
target_link_libraries(payable_tests PRIVATE payable_core)
add_test(NAME shared_vectors
         COMMAND payable_tests ${CMAKE_CURRENT_SOURCE_DIR}/../test-vectors/cards.json)
