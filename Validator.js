function Validator(formSelector) {
  var _this = this;

  /**
   * 
   * @param {*} element 
   * @param {*} selector 
   * Tìm parent của element dựa vào selector
   */
  function getParent(element, selector) {
    while (element.parentElement) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }

  // Object lưu những cái rule của form
  var formRules = {

  };

  /**
   * Quy ước tạo rule:
   * - Nếu có lỗi return `error message`
   * - Nếu không có lỗi thì return  `undefined`
   */
  var validatorRules = {
    required: function (value) {
      return value ? undefined : "Vui lòng nhập trường này"
    },
    email: function (value) {
      var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      return regex.test(value) ? undefined : 'Trường này phải là email';
    },
    min: function (min) {
      return value => {
        return value.length >= min ? undefined : `Vui long nhập ít nhất ${min} kí tự`;
      }
    },
    max: function (max) {
      return value => {
        return value.length >= max ? undefined : `Vui lòng nhập nhiều nhất ${max} kí tự`;
      }
    }
  }

  // Lấy ra form elemnt trong DOM theo `form selector`
  var formElement = document.querySelector(formSelector);

  //Nếu lấy được element trong DOM
  if (formElement) {
    // lấy thuộc tính có thuộc tính name và rule
    var inputs = formElement.querySelectorAll('[name][rules]');

    // Lặp qua từng thẻ input
    for (var input of inputs) {
      var rules = input.getAttribute("rules").split("|");
      for (var rule of rules) {
        var ruleInfo;
        var isRuleHasValue = rule.includes(":");
        // nếu rule chứa dấu :
        if (isRuleHasValue) {
          ruleInfo = rule.split(":");
          rule = ruleInfo[0];
        }

        var ruleFunc = validatorRules[rule];

        if (isRuleHasValue) {
          ruleFunc = ruleFunc(ruleInfo[1]);
        }

        if (Array.isArray(formRules[input.name])) {
          formRules[input.name].push(ruleFunc)
        } else {
          // Cho lần rule đầu tiên tạo ra 1 mảng
          formRules[input.name] = [ruleFunc];
        }
      }
      // Lắng nghe sự kiện đê validate
      input.onblur = handleValidate;
      input.oninput = handleClearError;
    }

    function handleValidate(event) {
      var rules = formRules[event.target.name];
      var errorMessage;
      for (var rule of rules) {
        errorMessage = rule(event.target.value);
        if (errorMessage) break;
      }
    

      // Nếu có lỗi thì hiển thị message lỗi ra UI
      if (errorMessage) {
        var formGroup = getParent(event.target, ".form-group");
        if (formGroup) {
          formGroup.classList.add("invalid");
          var formMessage = formGroup.querySelector(".form-message");
          if (formMessage) {
            formMessage.innerText = errorMessage;
          }
        }
      }
      return !errorMessage;
    }

    /**
     * @param {*} event 
     * Hàm clear message lỗi
     */
    function handleClearError(event) {
      var formGroup = getParent(event.target, '.form-group');
      if (formGroup.classList.contains('invalid')) {
        formGroup.classList.remove("invalid");
        var formMessage = formGroup.querySelector(".form-message");
        if (formMessage) {
          formMessage.innerText = "";
        }
      }
    }
  }


  // Xử lý hành vi submit form
  formElement.onsubmit = function (e) {
    // this ở trong đầy chính là cái form
    e.preventDefault();
    var inputs = formElement.querySelectorAll('[name][rules]');
    var isValid = true;
    for (var input of inputs) {
      if (!handleValidate({
        target: input
      })) {
        isValid = false
      }
    }
    // Khi không có lỗi thì submit form
    if (isValid) {
      if (typeof _this.onSubmit === "function") {
        var enableInputs = formElement.querySelectorAll('[name]');
        var formValues = Array.from(enableInputs).reduce(function (values, input) {

          switch (input.type) {
            case 'radio':
              values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
              break;
            case 'checkbox':
              if (!input.matches(':checked')) {
                values[input.name] = '';
                return values;
              }
              if (!Array.isArray(values[input.name])) {
                values[input.name] = [];
              }
              values[input.name].push(input.value);
              break;
            case 'file':
              values[input.name] = input.files;
              break;
            default:
              values[input.name] = input.value;
          }

          return values;
        }, {});

        _this.onSubmit(formValues);
      } else {
        formElement.submit();
      }
    }
  }
}