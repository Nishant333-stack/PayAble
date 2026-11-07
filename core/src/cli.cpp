// payable-cli: validate a card number from the command line and print JSON.
//   payable-cli 4111111111111111
#include <iostream>

#include "payable/validator.hpp"

int main(int argc, char** argv) {
    if (argc < 2) {
        std::cerr << "usage: payable-cli <card-number>\n";
        return 2;
    }
    auto registry = payable::NetworkRegistry::withDefaults();
    payable::CardValidator validator(registry);
    auto r = validator.validateNumber(argv[1]);

    std::cout << "{\"network\":\"" << r.networkId << "\",\"luhn\":" << (r.luhn ? "true" : "false")
              << ",\"lengthOk\":" << (r.lengthOk ? "true" : "false")
              << ",\"valid\":" << (r.valid ? "true" : "false") << ",\"errors\":[";
    for (std::size_t i = 0; i < r.errors.size(); ++i) {
        if (i) std::cout << ',';
        std::cout << '"' << payable::describe(r.errors[i]) << '"';
    }
    std::cout << "]}\n";
    return r.valid ? 0 : 1;
}
