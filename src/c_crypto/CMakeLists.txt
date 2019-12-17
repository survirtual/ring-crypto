cmake_minimum_required(VERSION 2.8.6)

set(VERSION "0.1")
# $Format:Packaged from commit %H%nset(COMMIT %h)%nset(REFS "%d")$

set_property(GLOBAL PROPERTY USE_FOLDERS ON)
set(CMAKE_CONFIGURATION_TYPES Debug RelWithDebInfo Release CACHE TYPE INTERNAL)
set(CMAKE_SKIP_INSTALL_RULES ON)
set(CMAKE_SKIP_PACKAGE_ALL_DEPENDENCY ON)
set(CMAKE_SUPPRESS_REGENERATION ON)

# EMCC 
# DUMB_HACK_0 <- DO NOT REMOVE!
set(TEST_BUILD "$ENV{TEST_BUILD}")
# Optimization level
if(TEST_BUILD)
  set(EMCC_FLAGS "-O0")
else()
  set(EMCC_FLAGS "-Os")
endif()


# Output
set(EMCC_FLAGS "${EMCC_FLAGS} -o bin/crypto")

# Needed because of some errors
# set(EMCC_FLAGS "${EMCC_FLAGS} -s ERROR_ON_UNDEFINED_SYMBOLS=0")

# Virtual filesystem support
set(EMCC_FLAGS "${EMCC_FLAGS} -s FORCE_FILESYSTEM=0")

# set(EMCC_FLAGS "${EMCC_FLAGS} -s LINKABLE=1")
# set(EMCC_FLAGS "${EMCC_FLAGS} -s DEMANGLE_SUPPORT=1")
set(EMCC_FLAGS "${EMCC_FLAGS} -s ALLOW_MEMORY_GROWTH=1")

# JS insertion needed for js build operations
# Insert before emscripten code
set(EMCC_FLAGS "${EMCC_FLAGS} --pre-js ${CMAKE_BINARY_DIR}/jsHooks/prehook.js")
# Insert after emscripten code
set(EMCC_FLAGS "${EMCC_FLAGS} --post-js ${CMAKE_BINARY_DIR}/jsHooks/posthook.js")

# Exported function binding support for JS -> wasm calls
set(EMCC_FLAGS "${EMCC_FLAGS} -s EXTRA_EXPORTED_RUNTIME_METHODS='[ccall, cwrap]'")

# Exported functions

# Built-ins
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS} _malloc")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _free")

# NaCl Message Crypto Lib
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _scalarmult_base")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _secretbox")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _secretbox_open")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _box_beforenm")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _box_keypair")

# Sign & Ring Crypto Lib
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _random_scalar")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _hash")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _generate_keys")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _check_key")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _secret_key_to_public_key")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _generate_signature")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _check_signature")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _generate_key_image")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _generate_ring_signature")
set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _check_ring_signature")

if(TEST_BUILD)
  add_definitions("/DTEST_BUILD")
  set(EMCC_EXPORTED_FUNCTIONS "${EMCC_EXPORTED_FUNCTIONS}, _setup_test")
endif()
# include_directories(test)

set(EMCC_FLAGS "${EMCC_FLAGS} -s EXPORTED_FUNCTIONS='[${EMCC_EXPORTED_FUNCTIONS}]'")

project(CryptoNote)

include_directories(include src external "${CMAKE_BINARY_DIR}/version")
if(APPLE)
  include_directories(SYSTEM /usr/include/malloc)
  enable_language(ASM)
endif()

set(STATIC ${MSVC} CACHE BOOL "Link libraries statically")

if(MSVC)
  add_definitions("/bigobj /MP /W3 /GS- /D_CRT_SECURE_NO_WARNINGS /wd4996 /wd4345 /D_WIN32_WINNT=0x0600 /DWIN32_LEAN_AND_MEAN /DGTEST_HAS_TR1_TUPLE=0 /D_VARIADIC_MAX=8 /D__SSE4_1__")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} /STACK:10485760")
  if(STATIC)
    foreach(VAR CMAKE_C_FLAGS_DEBUG CMAKE_CXX_FLAGS_DEBUG CMAKE_C_FLAGS_RELWITHDEBINFO CMAKE_CXX_FLAGS_RELWITHDEBINFO CMAKE_C_FLAGS_RELEASE CMAKE_CXX_FLAGS_RELEASE)
      string(REPLACE "/MD" "/MT" ${VAR} "${${VAR}}")
    endforeach()
  endif()
  include_directories(SYSTEM src/platform/msc)
else()
  if (${CMAKE_SYSTEM_NAME} STREQUAL "Linux")
    # This option has no effect in glibc version less than 2.20. 
    # Since glibc 2.20 _BSD_SOURCE is deprecated, this macro is recomended instead
    add_definitions("-D_DEFAULT_SOURCE -D_GNU_SOURCE")
  endif()
  set(WARNINGS "-Wall -Wextra -Wpointer-arith -Wundef -Wvla -Wwrite-strings -Werror -Wno-error=extra -Wno-error=unused-function -Wno-error=deprecated-declarations -Wno-error=sign-compare -Wno-error=strict-aliasing -Wno-error=type-limits -Wno-unused-parameter -Wno-error=unused-variable -Wno-error=undef -Wno-error=uninitialized -Wno-error=unused-result")
  if(CMAKE_C_COMPILER_ID STREQUAL "Clang")
    set(WARNINGS "${WARNINGS} -Wno-error=mismatched-tags -Wno-error=null-conversion -Wno-overloaded-shift-op-parentheses -Wno-error=shift-count-overflow -Wno-error=tautological-constant-out-of-range-compare -Wno-error=unused-private-field -Wno-error=unneeded-internal-declaration -Wno-error=unused-function")
  else()
    set(WARNINGS "${WARNINGS} -Wlogical-op -Wno-error=maybe-uninitialized -Wno-error=clobbered -Wno-error=unused-but-set-variable")
  endif()
  if(MINGW)
    set(WARNINGS "${WARNINGS} -Wno-error=unused-value")
    set(MINGW_FLAG "-DWIN32_LEAN_AND_MEAN")
  else()
    set(MINGW_FLAG "")
  endif()
  if(CMAKE_C_COMPILER_ID STREQUAL "GNU" AND NOT (CMAKE_C_COMPILER_VERSION VERSION_LESS 5.1))
    set(WARNINGS "${WARNINGS} -Wno-error=odr")
  endif()
  set(C_WARNINGS "-Waggregate-return -Wnested-externs -Wold-style-definition -Wstrict-prototypes")
  set(CXX_WARNINGS "-Wno-reorder -Wno-missing-field-initializers")
  set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -std=gnu17 ${MINGW_FLAG} ${WARNINGS} ${C_WARNINGS} ${ARCH_FLAG} -msse2 ${EMCC_FLAGS}")
  if(NOT APPLE)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -pthread")
  endif()
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=gnu++17 ${MINGW_FLAG} ${WARNINGS} ${CXX_WARNINGS} ${ARCH_FLAG} ${EMCC_FLAGS}")
  if(APPLE)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DGTEST_HAS_TR1_TUPLE=0")
  endif()
  if(CMAKE_C_COMPILER_ID STREQUAL "GNU" AND NOT (CMAKE_C_COMPILER_VERSION VERSION_LESS 4.8))
    set(DEBUG_FLAGS "-g3 -Og")
  else()
    set(DEBUG_FLAGS "-g3 -O0")
  endif()
  set(RELEASE_FLAGS "-Ofast -DNDEBUG -Wno-unused-variable")
  if(NOT APPLE)
    # There is a clang bug that does not allow to compile code that uses AES-NI intrinsics if -flto is enabled
    if (CMAKE_C_COMPILER_ID STREQUAL "GNU" AND CMAKE_SYSTEM_NAME STREQUAL "Linux" 
        AND CMAKE_BUILD_TYPE STREQUAL "Release" AND ((CMAKE_C_COMPILER_VERSION VERSION_GREATER 4.9) OR (CMAKE_C_COMPILER_VERSION VERSION_EQUAL 4.9)))
      # On linux, to build in lto mode, check that ld.gold linker is used: 'update-alternatives --install /usr/bin/ld ld /usr/bin/ld.gold HIGHEST_PRIORITY'
      set(CMAKE_AR gcc-ar)
      set(CMAKE_RANLIB gcc-ranlib)
    endif()
    set(RELEASE_FLAGS "${RELEASE_FLAGS} -flto")
  endif()
  #if(CMAKE_C_COMPILER_ID STREQUAL "GNU" AND NOT MINGW)
  #  set(RELEASE_FLAGS "${RELEASE_FLAGS} -fno-fat-lto-objects")
  #endif()
  set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} ${DEBUG_FLAGS}")
  set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} ${DEBUG_FLAGS} ")
  set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} ${RELEASE_FLAGS}")
  set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} ${RELEASE_FLAGS}")
  if(STATIC AND NOT APPLE)
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -static-libgcc -static-libstdc++")
  endif()
endif()

set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
add_subdirectory(src)
add_executable(crypto main.cpp)
target_link_libraries(crypto Crypto)