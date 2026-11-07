// PayAble core - validation API.
#pragma once

#include <optional>
#include <string>
#include <string_view>
#include <vector>

#include "payable/card_network.hpp"

namespace payable {

// Strips spaces and dashes. Returns nullopt if any other non-digit appears.
std::optional<std::string> normalizePan(std::string_view input);

// Luhn (mod 10) checksum over a digits-only string.
bool luhnCheck(std::string_view digits);

enum class ErrorCode {
    Empty,
    InvalidCharacters,
    UnknownNetwork,
    InvalidLength,
    ChecksumFailed,
    InvalidMonth,
    Expired,
    TooFarInFuture,
    InvalidCvv,
};

// Plain-language message suitable for an accessible error summary.
std::string describe(ErrorCode code);

struct CardResult {
    std::string networkId = "unknown";
    bool luhn = false;
    bool lengthOk = false;
    bool valid = false;
    std::vector<ErrorCode> errors;
};

struct YearMonth {
    int year;
    int month;
};

class CardValidator {
public:
    explicit CardValidator(const NetworkRegistry& registry) : registry_(registry) {}

    CardResult validateNumber(std::string_view pan) const;
    std::vector<ErrorCode> validateExpiry(int month, int year, YearMonth now) const;
    std::vector<ErrorCode> validateCvv(std::string_view cvv, std::string_view networkId) const;

    static constexpr int kMaxYearsAhead = 20;

private:
    const NetworkRegistry& registry_;
};

}  // namespace payable
