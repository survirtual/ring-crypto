add_definitions(-DSTATICLIB)


file(GLOB_RECURSE Crypto ./*)

source_group("" FILES ${Crypto})

add_library(Crypto ${Crypto})