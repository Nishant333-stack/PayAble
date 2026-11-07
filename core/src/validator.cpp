#include "payable/validator.hpp"

#include <cctype>

namespace payable {

std::optional<std::string> normalizePan(std::string_view input) {
    std::string out;
    out.reserve(input.size());
    for (char c : input) {
        if (c == ' ' || c == '-') continue;
        if (!std::isdigit(static_cast<unsigned char>(c))) return std::nullopt;
        out.push_back(c);
    }
    return out;
}

bool luhnCheck(std::string_view digits) {
    if (digits.empty()) return false;
    int sum = 0;
    bool doubleIt = false;
    for (auto it = digits.rbegin(); it != digits.rend(); ++it) {
        int d = *it - '0';
        if (doubleIt) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        sum += d;
        doubleIt = !doubleIt;
    }
    return sum % 10 == 0;
}

std::string describe(ErrorCode code) {
    switch (code) {
        case ErrorCode::Empty: return "Enter your card number.";
        case ErrorCode::InvalidCharacters: return "Card number can only contain digits.";
        case ErrorCode::UnknownNetwork: return "We don't recognise this card type. Check the first digits.";
        case ErrorCode::InvalidLength: return "Card number is the wrong length for this card type.";
        case ErrorCode::ChecksumFailed: return "Card number looks mistyped. Check each digit.";
        case ErrorCode::InvalidMonth: return "Expiry month must be between 01 and 12.";
        case ErrorCode::Expired: return "This card has expired.";
        case ErrorCode::TooFarInFuture: return "Expiry year is too far in the future.";
        case ErrorCode::InvalidCvv: return "Security code is the wrong length.";
    }
    return "Unknown error.";
}

CardResult CardValidator::validateNumber(std::string_view pan) const {
    CardResult result;
    auto digits = normalizePan(pan);
    if (!digits) {
        result.errors.push_back(ErrorCode::InvalidCharacters);
        return result;
    }
    if (digits->empty()) {
        result.errors.push_back(ErrorCode::Empty);
        return result;
    }

    result.luhn = luhnCheck(*digits);
    const CardNetwork* network = registry_.detect(*digits);
    if (!network) {
        result.errors.push_back(ErrorCode::UnknownNetwork);
    } else {
        result.networkId = network->id();
        result.lengthOk = network->isValidLength(digits->size());
        if (!result.lengthOk) result.errors.push_back(ErrorCode::InvalidLength);
    }
    if (!result.luhn) result.errors.push_back(ErrorCode::ChecksumFailed);

    result.valid = result.errors.empty();
    return result;
}

std::vector<ErrorCode> CardValidator::validateExpiry(int month, int year, YearMonth now) const {
    if (month < 1 || month > 12) return {ErrorCode::InvalidMonth};
    // A card is usable through the last day of its expiry month.
    if (year < now.year || (year == now.year && month < now.month)) return {ErrorCode::Expired};
    if (year > now.year + kMaxYearsAhead) return {ErrorCode::TooFarInFuture};
    return {};
}

std::vector<ErrorCode> CardValidator::validateCvv(std::string_view cvv, std::string_view networkId) const {
    const CardNetwork* network = registry_.byId(networkId);
    std::size_t expected = network ? network->cvvLength() : 3;
    if (cvv.size() != expected) return {ErrorCode::InvalidCvv};
    for (char c : cvv) {
        if (!std::isdigit(static_cast<unsigned char>(c))) return {ErrorCode::InvalidCvv};
    }
    return {};
}

}  // namespace payable
