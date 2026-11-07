// Runs the shared JSON test vectors (test-vectors/cards.json) against the C++
// core, plus a few unit tests. Uses a tiny line-based reader because every
// vector sits on its own line - this keeps the core dependency-free.
#include <fstream>
#include <iostream>
#include <regex>
#include <sstream>
#include <string>

#include "payable/validator.hpp"

namespace {

int g_passed = 0;
int g_failed = 0;

void check(bool ok, const std::string& name) {
    if (ok) {
        ++g_passed;
    } else {
        ++g_failed;
        std::cerr << "FAIL: " << name << '\n';
    }
}

std::string field(const std::string& line, const std::string& key) {
    std::regex re("\"" + key + "\"\\s*:\\s*(\"([^\"]*)\"|true|false|-?\\d+)");
    std::smatch m;
    if (!std::regex_search(line, m, re)) return "";
    return m[2].matched ? m[2].str() : m[1].str();
}

}  // namespace

int main(int argc, char** argv) {
    const std::string path = argc > 1 ? argv[1] : "test-vectors/cards.json";
    std::ifstream in(path);
    if (!in) {
        std::cerr << "cannot open " << path << '\n';
        return 2;
    }

    auto registry = payable::NetworkRegistry::withDefaults();
    payable::CardValidator v(registry);

    std::string line, section;
    while (std::getline(in, line)) {
        if (line.find("\"cards\"") != std::string::npos) section = "cards";
        else if (line.find("\"expiry\"") != std::string::npos) section = "expiry";
        else if (line.find("\"cvv\": [") != std::string::npos) section = "cvv";
        if (line.find('{') == std::string::npos || line.find("_comment") != std::string::npos) continue;

        if (section == "cards" && line.find("\"pan\"") != std::string::npos) {
            auto pan = field(line, "pan");
            auto r = v.validateNumber(pan);
            check(r.networkId == field(line, "network"), "network " + pan);
            check(r.luhn == (field(line, "luhn") == "true"), "luhn " + pan);
            check(r.valid == (field(line, "valid") == "true"), "valid " + pan);
        } else if (section == "expiry" && line.find("\"month\"") != std::string::npos) {
            std::smatch m;
            std::regex nowRe("\"now\"\\s*:\\s*\\[(\\d+),\\s*(\\d+)\\]");
            std::regex_search(line, m, nowRe);
            payable::YearMonth now{std::stoi(m[1]), std::stoi(m[2])};
            int month = std::stoi(field(line, "month"));
            int year = std::stoi(field(line, "year"));
            bool ok = v.validateExpiry(month, year, now).empty();
            check(ok == (field(line, "valid") == "true"),
                  "expiry " + std::to_string(month) + "/" + std::to_string(year));
        } else if (section == "cvv" && line.find("\"cvv\"") != std::string::npos) {
            auto cvv = field(line, "cvv");
            bool ok = v.validateCvv(cvv, field(line, "network")).empty();
            check(ok == (field(line, "valid") == "true"), "cvv " + cvv + " " + field(line, "network"));
        }
    }

    // Unit tests beyond the shared vectors.
    check(payable::normalizePan("4111 1111-1111 1111").value() == "4111111111111111", "normalize mixed separators");
    check(!payable::normalizePan("4111.1111").has_value(), "normalize rejects dots");
    check(!payable::luhnCheck(""), "luhn empty");
    check(registry.detect("2720990000000000")->id() == "mastercard", "mastercard 2-series upper bound");
    check(registry.detect("2721000000000000") == nullptr, "outside mastercard 2-series");
    check(registry.detect("6530000000000000")->id() == "rupay", "rupay wins over discover in 65 overlap");
    check(registry.detect("6540000000000000")->id() == "discover", "discover 65 outside rupay");
    check(!payable::describe(payable::ErrorCode::Expired).empty(), "error messages are human readable");

    std::cout << g_passed << " passed, " << g_failed << " failed\n";
    return g_failed == 0 ? 0 : 1;
}
